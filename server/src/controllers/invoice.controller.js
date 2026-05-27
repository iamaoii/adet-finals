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

  const invoiceNumber = find([
    /invoice\s*(?:no\.?|number|#)[:\s]+([A-Z0-9\-]+)/i,
    /inv[:\s#]+([A-Z0-9\-]+)/i,
  ]);

  const supplierName = find([
    /(?:from|supplier|vendor|sold by|company)[:\s]+(.+)/i,
    /^([A-Z][A-Za-z\s&.,]+(?:Inc|LLC|Corp|Ltd|Co)?\.?)\s*$/,
  ]);

  const invoiceDate = find([
    /(?:invoice\s*date|date|dated)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /(?:invoice\s*date|date|dated)[:\s]+(\w+ \d{1,2},? \d{4})/i,
  ]);

  const totalAmount = find([
    /(?:total|amount due|balance due|grand total)[:\s]+(?:PHP|₱|\$)?[\s]*([\d,]+\.?\d*)/i,
    /(?:PHP|₱|\$)\s*([\d,]+\.?\d{2})\s*$/im,
  ]);

  // Dynamic Category Classifier based on keywords
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
    supplierName,
    invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString().split('T')[0] : null,
    totalAmount: totalAmount ? parseFloat(totalAmount.replace(/,/g, '')) : null,
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
  const { supplier_name, invoice_number, invoice_date, total_amount, due_date, category, status, notes } = req.body;

  const { rows } = await query(
    `UPDATE invoices SET
       supplier_name  = COALESCE($1, supplier_name),
       invoice_number = COALESCE($2, invoice_number),
       invoice_date   = COALESCE($3, invoice_date),
       total_amount   = COALESCE($4, total_amount),
       due_date       = COALESCE($5, due_date),
       category       = COALESCE($6, category),
       status         = COALESCE($7, status),
       notes          = COALESCE($8, notes)
     WHERE id = $9
     RETURNING *`,
    [supplier_name, invoice_number, invoice_date, total_amount, due_date, category, status, notes, req.params.id]
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

  // Remove from Cloudinary
  if (rows[0].file_public_id) {
    await cloudinary.uploader.destroy(rows[0].file_public_id, { resource_type: 'auto' });
  }

  await query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
  res.json({ message: 'Invoice deleted' });
};

/* POST /api/invoices/:id/confirm  — user confirms OCR data */
export const confirmInvoice = async (req, res) => {
  const { supplier_name, invoice_number, invoice_date, total_amount, due_date, category, notes } = req.body;

  const { rows } = await query(
    `UPDATE invoices SET
       supplier_name  = $1,
       invoice_number = $2,
       invoice_date   = $3,
       total_amount   = $4,
       due_date       = $5,
       category       = $6,
       notes          = $7,
       status         = 'verified'
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [supplier_name, invoice_number, invoice_date, total_amount, due_date, category, notes, req.params.id, req.user.id]
  );
  if (!rows[0]) throw new AppError('Invoice not found or not yours', 404);

  await runAnomalyChecks(rows[0]);
  res.json(rows[0]);
};

// ── Anomaly detection ─────────────────────────────────────

async function runAnomalyChecks(invoice) {
  const checks = [];

  // 1. Missing required fields
  const missing = [];
  if (!invoice.supplier_name)  missing.push('supplier_name');
  if (!invoice.invoice_number) missing.push('invoice_number');
  if (!invoice.invoice_date)   missing.push('invoice_date');
  if (!invoice.total_amount)   missing.push('total_amount');

  if (missing.length) {
    checks.push({
      invoice_id: invoice.id,
      type: 'missing_field',
      message: `Missing fields: ${missing.join(', ')}`,
    });
  }

  // 2. High-value alert (> 100,000 PHP)
  if (invoice.total_amount && invoice.total_amount > 100000) {
    checks.push({
      invoice_id: invoice.id,
      type: 'high_value',
      message: `High-value invoice: ₱${parseFloat(invoice.total_amount).toLocaleString()}`,
    });
  }

  // 3. Duplicate detection (same supplier + total + date)
  if (invoice.supplier_name && invoice.total_amount && invoice.invoice_date) {
    const dupes = await query(
      `SELECT id FROM invoices
       WHERE id != $1
         AND supplier_name ILIKE $2
         AND total_amount = $3
         AND invoice_date = $4`,
      [invoice.id, invoice.supplier_name, invoice.total_amount, invoice.invoice_date]
    );
    if (dupes.rows.length) {
      checks.push({
        invoice_id: invoice.id,
        type: 'duplicate',
        message: `Possible duplicate of invoice ${dupes.rows[0].id}`,
      });
    }
  }

  // Persist alerts (avoid re-inserting same type)
  for (const check of checks) {
    await query(
      `INSERT INTO alerts (invoice_id, type, message)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [check.invoice_id, check.type, check.message]
    );
  }
}
