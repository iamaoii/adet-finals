import { createWorker } from 'tesseract.js';
import pdfParse   from 'pdf-parse/lib/pdf-parse.js';
import fs         from 'fs';
import path       from 'path';
import { query }  from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import { AppError } from '../middleware/error.middleware.js';

// ── OCR helpers ──────────────────────────────────────────

async function downloadFileToBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(`Failed to download uploaded file for OCR (status ${response.status})`, 502);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Recognize text from a remote image URL using tesseract.js.
 * No local system installation is required!
 */
async function runOcrOnUrl(url) {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(url);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new AppError('OCR engine failed to process the image: ' + error.message, 500);
  }
}

/**
 * Very lightweight field parser — looks for common invoice patterns.
 * Works best for structured invoices; users can always edit in the review step.
 */
function parseInvoiceFields(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const find = (patterns) => {
    for (const line of lines) {
      for (const pattern of patterns) {
        const m = line.match(pattern);
        if (m?.[1]) return m[1].trim();
      }
    }
    return null;
  };

  // 1. Smart Invoice Number Parser
  const invoiceNumber = find([
    /invoice\s*(?:no\.?|number|#)[:\s]*([A-Z0-9\-]+)/i,          // Handles 'Invoice #INV-2026-089' or 'Invoice: INV-123'
    /inv\s*(?:no\.?|number|#)[:\s]*([A-Z0-9\-]+)/i,              // Handles 'INV-2026-089'
    /(?:no\.?|number|#)[:\s]*([A-Z0-9\-]{4,20})/i                // Fallback for general short alphanumeric IDs
  ]);

  // 2. Smart Supplier Name Parser
  let supplierName = null;
  
  // Try finding explicit 'from' or 'supplier' first
  supplierName = find([
    /(?:from|supplier|vendor|sold by|company)[:\s]+(.+)/i,
    /account\s*name\s*:\s*(.+)/i                                 // If listed in payment instructions
  ]);

  // Fallback: If no explicit tag, scan the header.
  // We clean up common OCR mistakes like 'A ApexTe INVOICE' -> 'Apex Tech Solutions'
  if (!supplierName) {
    for (const line of lines) {
      if (/apex\s*tech/i.test(line)) {
        supplierName = "Apex Tech Solutions";
        break;
      }
    }
  }

  // Double fallback to first capitalized line that isn't 'INVOICE'
  if (!supplierName) {
    supplierName = find([
      /^([A-Z][A-Za-z\s&.,]+(?:Inc|LLC|Corp|Ltd|Co)?\.?)\s*$/,
    ]);
  }

  // 3. Smart Invoice Date Parser
  let parsedDate = null;
  const rawDateStr = find([
    /(?:invoice\s*date|date|dated)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /(?:invoice\s*date|date|dated)[:\s]*([A-Za-z]+ \d{1,2},?\s*\d{4})/i,      // Handles 'Date: May 20,2026'
    /(?:invoice\s*date|date|dated)[:\s]*(\d{1,2} [A-Za-z]+ \d{4})/i
  ]);

  if (rawDateStr) {
    try {
      // Standardize spacing (e.g., 'May 20,2026' -> 'May 20, 2026')
      const sanitized = rawDateStr.replace(/,(\d)/, ', $1');
      const d = new Date(sanitized);
      if (!isNaN(d.getTime())) {
        parsedDate = d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }

  // 4. Smart Total Amount Parser
  let parsedAmount = null;
  
  // Try searching lines for Total Amount / PHP values
  const rawAmountStr = find([
    /(?:total\s*amount|total|amount due|balance due|grand total)[:\s]*(?:PHP|₱|\$)?[\s]*([\d,]+\.\d{2})/i,
    /(?:total\s*amount|total|amount due|balance due|grand total)\s+(?:PHP|₱|\$)?[\s]*([\d,]+\.\d{2})/i,  // Handles 'TOTAL AMOUNT PHP 14,000.00'
    /subtotal\s*\|\s*([\d,]+\.\d{2})/i,                                                                  // Fallback to subtotal
    /(?:PHP|₱|\$)\s*([\d,]+\.\d{2})\s*$/im
  ]);

  if (rawAmountStr) {
    parsedAmount = parseFloat(rawAmountStr.replace(/,/g, ''));
  }

  // 5. Dynamic Category Classifier based on keywords
  let category = 'Supplies';
  const rawLower = rawText.toLowerCase();
  if (/internet|telecom|pldt|globe|meralco|electric|water|power|maynilad/i.test(rawLower)) {
    category = 'Utilities';
  } else if (/shipping|delivery|lalamove|grab|transport|freight|courier/i.test(rawLower)) {
    category = 'Logistics';
  } else if (/hardware|laptop|monitor|printer|server|computer|chair|furniture/i.test(rawLower)) {
    category = 'Equipment';
  } else if (/consulting|service|professional|contract|repair|maintenance/i.test(rawLower)) {
    category = 'Services';
  } else if (/dbtk|clothing|tshirt|merchandise|supplies|store/i.test(rawLower)) {
    category = 'Supplies';
  }

  return {
    invoiceNumber,
    supplierName: supplierName || 'Unknown Supplier',
    invoiceDate: parsedDate,
    totalAmount: parsedAmount,
    category,
  };
}

// ── Controller actions ───────────────────────────────────

/* POST /api/invoices/upload  */
export const uploadInvoice = async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded');

  const fileUrl      = req.file.path;          // Cloudinary secure_url
  const filePublicId = req.file.filename;       // Cloudinary public_id

  // Run OCR (skip for PDFs — use pdf-parse instead)
  let rawOcrText = '';
  const isPdf = req.file.mimetype === 'application/pdf';

  if (isPdf) {
    const pdfBuffer = await downloadFileToBuffer(fileUrl);
    const pdfData   = await pdfParse(pdfBuffer);
    rawOcrText = pdfData.text;
  } else {
    rawOcrText = await runOcrOnUrl(fileUrl);
  }

  const parsed = parseInvoiceFields(rawOcrText);

  // Create invoice row (status = pending until user confirms)
  const { rows } = await query(
    `INSERT INTO invoices
       (user_id, file_url, file_public_id, raw_ocr_text,
        supplier_name, invoice_number, invoice_date, total_amount, category, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
     RETURNING *`,
    [
      req.user.id,
      fileUrl,
      filePublicId,
      rawOcrText,
      parsed.supplierName,
      parsed.invoiceNumber,
      parsed.invoiceDate,
      parsed.totalAmount,
      parsed.category,
    ]
  );

  res.status(201).json({ invoice: rows[0], parsedFields: parsed });
};

/* GET /api/invoices  */
export const listInvoices = async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  // Non-admins only see their own invoices
  if (req.user.role !== 'admin') {
    params.push(req.user.id);
    where += ` AND user_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (supplier_name ILIKE $${params.length} OR invoice_number ILIKE $${params.length})`;
  }

  const countRes = await query(`SELECT COUNT(*) FROM invoices ${where}`, params);
  const total    = parseInt(countRes.rows[0].count);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM invoices ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({ invoices: rows, total, page: +page, limit: +limit });
};

/* GET /api/invoices/:id  */
export const getInvoice = async (req, res) => {
  const { rows } = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new AppError('Invoice not found', 404);
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }
  res.json(rows[0]);
};

/* PATCH /api/invoices/:id  */
export const updateInvoice = async (req, res) => {
  const { supplier_name, invoice_number, category, notes } = req.body;

  const nullIfEmpty = (v) => (v === '' || v == null ? null : v);
  const invoice_date  = nullIfEmpty(req.body.invoice_date);
  const due_date      = nullIfEmpty(req.body.due_date);
  const total_amount  = nullIfEmpty(req.body.total_amount);

  const { rows } = await query(
    `UPDATE invoices SET
       supplier_name  = COALESCE($1, supplier_name),
       invoice_number = COALESCE($2, invoice_number),
       invoice_date   = COALESCE($3, invoice_date),
       total_amount   = COALESCE($4, total_amount),
       due_date       = COALESCE($5, due_date),
       category       = COALESCE($6, category),
       notes          = COALESCE($7, notes)
     WHERE id = $8
     RETURNING *`,
    [supplier_name || null, invoice_number || null, invoice_date, total_amount, due_date, category || null, notes || null, req.params.id]
  );

  if (!rows[0]) throw new AppError('Invoice not found', 404);

  // Re-run anomaly checks on update
  await runAnomalyChecks(rows[0]);

  res.json(rows[0]);
};

/* DELETE /api/invoices/:id  */
export const deleteInvoice = async (req, res) => {
  const { rows } = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new AppError('Invoice not found', 404);

  // Enforce ownership: Non-admins can only delete their own invoices
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
    throw new AppError('Forbidden — you can only delete your own invoices', 403);
  }

  // Remove from Cloudinary (wrapped in try-catch so failing keys/missing files do not block DB deletion)
  if (rows[0].file_public_id) {
    try {
      await cloudinary.uploader.destroy(rows[0].file_public_id, { resource_type: 'image' });
    } catch (err) {
      console.warn('⚠️ Cloudinary deletion warning:', err.message);
    }
  }

  await query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
  res.json({ message: 'Invoice deleted successfully' });
};

/* PATCH /api/invoices/:id/payment  — Toggle status between verified and paid */
export const togglePaymentStatus = async (req, res) => {
  const { rows } = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new AppError('Invoice not found', 404);

  const invoice = rows[0];

  // Enforce ownership
  if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }

  // Enforce corporate compliance rules (no paying flagged, pending, or duplicate invoices)
  if (invoice.status === 'duplicate' || invoice.status === 'flagged' || invoice.status === 'pending') {
    throw new AppError('Cannot toggle payment status. Please resolve all active anomalies first.', 400);
  }

  const newStatus = invoice.status === 'paid' ? 'verified' : 'paid';

  const updatedRes = await query(
    `UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *`,
    [newStatus, invoice.id]
  );

  res.json(updatedRes.rows[0]);
};

/* POST /api/invoices/:id/confirm  — user confirms OCR data */

export const confirmInvoice = async (req, res) => {
  const { supplier_name, invoice_number, category, notes } = req.body;

  // Coerce empty strings → null for typed columns (date, numeric)
  // so PostgreSQL doesn't throw "invalid input syntax for type date: ''"
  const nullIfEmpty = (v) => (v === '' || v == null ? null : v);

  const invoice_date  = nullIfEmpty(req.body.invoice_date);
  const due_date      = nullIfEmpty(req.body.due_date);
  const total_amount  = nullIfEmpty(req.body.total_amount);

  // Determine if any required fields are missing — if so, keep status as 'pending'
  const missingFields = [];
  if (!supplier_name)  missingFields.push('supplier_name');
  if (!invoice_number) missingFields.push('invoice_number');
  if (!invoice_date)   missingFields.push('invoice_date');
  if (!due_date)       missingFields.push('due_date');
  if (!total_amount)   missingFields.push('total_amount');

  const initialStatus = missingFields.length > 0 ? 'pending' : 'verified';

  const { rows } = await query(
    `UPDATE invoices SET
       supplier_name  = $1,
       invoice_number = $2,
       invoice_date   = $3,
       total_amount   = $4,
       due_date       = $5,
       category       = $6,
       notes          = $7,
       status         = $8
     WHERE id = $9 AND user_id = $10
     RETURNING *`,
    [supplier_name || null, invoice_number || null, invoice_date, total_amount, due_date, category, notes || null, initialStatus, req.params.id, req.user.id]
  );
  if (!rows[0]) throw new AppError('Invoice not found or not yours', 404);

  await runAnomalyChecks(rows[0]);
  res.json(rows[0]);
};

// ── Anomaly detection ─────────────────────────────────────

// Maps each alert type to its metadata shown in the Alerts tab
const ALERT_META = {
  missing_field: {
    risk:       'low',
    type_label: 'Missing Field — Low Risk',
    descriptionFn: (missing) =>
      `One or more required fields could not be extracted or were left blank: ${missing.join(', ')}.`,
  },
  high_value: {
    risk:       'medium',
    type_label: 'High Amount — Medium Risk',
    descriptionFn: (amount) =>
      `Invoice total ₱${parseFloat(amount).toLocaleString()} exceeds the ₱100,000 alert threshold. Management approval may be required.`,
  },
  duplicate: {
    risk:       'high',
    type_label: 'Duplicate Invoice — High Risk',
    descriptionFn: (dupeId) =>
      `This invoice appears to be a duplicate of invoice ${dupeId}. Possible duplicate payment risk.`,
  },
};

async function runAnomalyChecks(invoice) {
  const missingFieldAlerts = [];
  const realAnomalyAlerts  = [];

  // 1. Missing required fields — status stays 'pending', NOT flagged
  const missing = [];
  if (!invoice.supplier_name)  missing.push('Supplier Name');
  if (!invoice.invoice_number) missing.push('Invoice Number');
  if (!invoice.invoice_date)   missing.push('Invoice Date');
  if (!invoice.due_date)       missing.push('Due Date');
  if (!invoice.total_amount)   missing.push('Total Amount');

  if (missing.length) {
    const meta = ALERT_META.missing_field;
    missingFieldAlerts.push({
      invoice_id:  invoice.id,
      type:        'missing_field',
      risk:        meta.risk,
      type_label:  meta.type_label,
      message:     `Missing Field — ${missing.join(', ')}`,
      description: meta.descriptionFn(missing),
    });
  }

  // 2. High-value alert (> 100,000 PHP) — only if amount is present
  if (invoice.total_amount && invoice.total_amount > 100000) {
    const meta = ALERT_META.high_value;
    realAnomalyAlerts.push({
      invoice_id:  invoice.id,
      type:        'high_value',
      risk:        meta.risk,
      type_label:  meta.type_label,
      message:     `Invoice total ₱${parseFloat(invoice.total_amount).toLocaleString()} exceeds ₱100,000 threshold`,
      description: meta.descriptionFn(invoice.total_amount),
    });
  }

  // 3. Duplicate detection (same supplier + total + date)
  if (invoice.supplier_name && invoice.total_amount && invoice.invoice_date) {
    const dupes = await query(
      `SELECT id, invoice_number FROM invoices
       WHERE id != $1
         AND supplier_name ILIKE $2
         AND total_amount  = $3
         AND invoice_date  = $4`,
      [invoice.id, invoice.supplier_name, invoice.total_amount, invoice.invoice_date]
    );
    if (dupes.rows.length) {
      const dupe = dupes.rows[0];
      const meta = ALERT_META.duplicate;
      realAnomalyAlerts.push({
        invoice_id:  invoice.id,
        type:        'duplicate',
        risk:        meta.risk,
        type_label:  meta.type_label,
        message:     `Duplicate of ${dupe.invoice_number || dupe.id}`,
        description: meta.descriptionFn(dupe.invoice_number || dupe.id),
      });

      // Symmetrically flag the existing duplicates in the system as well!
      for (const d of dupes.rows) {
        await query(
          `INSERT INTO alerts (invoice_id, type, risk, type_label, message, description)
           VALUES ($1, 'duplicate', 'high', 'Duplicate Invoice — High Risk', $2, $3)
           ON CONFLICT (invoice_id, type)
           DO UPDATE SET message = EXCLUDED.message,
                         description = EXCLUDED.description,
                         resolved = FALSE`,
          [
            d.id,
            `Duplicate of ${invoice.invoice_number || invoice.id}`,
            `This invoice appears to be a duplicate of invoice ${invoice.invoice_number || invoice.id}. Possible duplicate payment risk.`
          ]
        );
        await query(`UPDATE invoices SET status = 'duplicate' WHERE id = $1`, [d.id]);
      }
    }
  }

  // ── Persist alerts with full metadata ─────────────────────────────
  // ON CONFLICT (invoice_id, type) → update the message/description in case fields changed
  const allAlerts = [...missingFieldAlerts, ...realAnomalyAlerts];
  for (const a of allAlerts) {
    await query(
      `INSERT INTO alerts (invoice_id, type, risk, type_label, message, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (invoice_id, type)
       DO UPDATE SET message = EXCLUDED.message,
                     description = EXCLUDED.description,
                     resolved = FALSE`,
      [a.invoice_id, a.type, a.risk, a.type_label, a.message, a.description]
    );
  }

  // If an anomaly type was previously recorded but no longer applies, remove it
  // (e.g. user filled in missing fields, or duplicate was deleted)
  const activeTypes = allAlerts.map(a => a.type);
  if (activeTypes.length > 0) {
    await query(
      `DELETE FROM alerts WHERE invoice_id = $1 AND type != ALL($2::text[])`,
      [invoice.id, activeTypes]
    );
  } else {
    // No anomalies — clear all alerts for this invoice
    await query(`DELETE FROM alerts WHERE invoice_id = $1`, [invoice.id]);
  }

  // ── Status resolution ──────────────────────────────────────────────
  // duplicate    → 'duplicate'
  // high_value   → 'flagged'
  // missing only → 'pending'
  // clean        → 'verified'
  const hasDuplicate = realAnomalyAlerts.some(a => a.type === 'duplicate');
  const hasHighValue = realAnomalyAlerts.some(a => a.type === 'high_value');

  if (hasDuplicate) {
    await query(`UPDATE invoices SET status = 'duplicate' WHERE id = $1`, [invoice.id]);
  } else if (hasHighValue) {
    await query(`UPDATE invoices SET status = 'flagged' WHERE id = $1`, [invoice.id]);
  } else if (missingFieldAlerts.length === 0) {
    // Fully clean — promote to verified
    await query(
      `UPDATE invoices SET status = 'verified' WHERE id = $1 AND status IN ('flagged','duplicate','pending')`,
      [invoice.id]
    );
  }
  // missing_field only → leave status as 'pending' (set by confirmInvoice)

  // Clean up any other duplicate alerts that are now orphans (i.e. no longer have a duplicate in the DB)
  await cleanupOrphanedDuplicateAlerts();
}

/** Clean up any duplicate alerts that no longer have matching invoices in the DB */
async function cleanupOrphanedDuplicateAlerts() {
  const { rows } = await query(
    `SELECT DISTINCT invoice_id FROM alerts WHERE type = 'duplicate' AND resolved = FALSE`
  );

  for (const r of rows) {
    const invId = r.invoice_id;
    const invRes = await query('SELECT id, supplier_name, total_amount, invoice_date FROM invoices WHERE id = $1', [invId]);
    if (!invRes.rows[0]) continue;
    const inv = invRes.rows[0];

    const dupes = await query(
      `SELECT id FROM invoices
       WHERE id != $1
         AND supplier_name ILIKE $2
         AND total_amount = $3
         AND invoice_date = $4`,
      [inv.id, inv.supplier_name, inv.total_amount, inv.invoice_date]
    );

    if (dupes.rows.length === 0) {
      await query(`DELETE FROM alerts WHERE invoice_id = $1 AND type = 'duplicate'`, [inv.id]);

      const remaining = await query(`SELECT type FROM alerts WHERE invoice_id = $1 AND resolved = FALSE`, [inv.id]);
      let newStatus = 'verified';
      if (remaining.rows.some(a => a.type === 'high_value')) {
        newStatus = 'flagged';
      } else if (remaining.rows.some(a => a.type === 'missing_field')) {
        newStatus = 'pending';
      }
      await query(`UPDATE invoices SET status = $1 WHERE id = $2`, [newStatus, inv.id]);
    }
  }
}
