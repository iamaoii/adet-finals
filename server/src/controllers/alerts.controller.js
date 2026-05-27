import { query } from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

/* GET /api/alerts */
export const listAlerts = async (req, res) => {
  // Fetch alerts for invoices that are currently 'flagged', 'duplicate', or 'pending' (missing fields).
  // 'pending' = saved with missing required fields; 'flagged' = high value; 'duplicate' = duplicate detected.

  let rows;
  if (req.user.role === 'admin') {
    // Admin sees all alerts
    const result = await query(
      `SELECT
         a.id,
         a.invoice_id,
         a.type,
         a.risk,
         a.type_label   AS "typeLabel",
         a.message      AS title,
         a.description,
         a.similarity,
         a.resolved,
         a.created_at,
         i.invoice_number,
         i.supplier_name,
         i.total_amount
       FROM alerts a
       LEFT JOIN invoices i ON i.id = a.invoice_id
       WHERE i.status IN ('flagged', 'duplicate', 'pending')
       ORDER BY
         CASE a.risk WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
         a.created_at DESC`
    );
    rows = result.rows;
  } else {
    // Regular user only sees alerts for their own invoices
    const result = await query(
      `SELECT
         a.id,
         a.invoice_id,
         a.type,
         a.risk,
         a.type_label   AS "typeLabel",
         a.message      AS title,
         a.description,
         a.similarity,
         a.resolved,
         a.created_at,
         i.invoice_number,
         i.supplier_name,
         i.total_amount
       FROM alerts a
       INNER JOIN invoices i ON i.id = a.invoice_id
       WHERE i.status IN ('flagged', 'duplicate', 'pending') AND i.user_id = $1
       ORDER BY
         CASE a.risk WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
         a.created_at DESC`,
      [req.user.id]
    );
    rows = result.rows;
  }

  res.json(rows);
};

/* PATCH /api/alerts/:id/resolve */
export const resolveAlert = async (req, res) => {
  // Check alert ownership/access if not admin
  if (req.user.role !== 'admin') {
    const check = await query(
      `SELECT a.id FROM alerts a
       INNER JOIN invoices i ON i.id = a.invoice_id
       WHERE a.id = $1 AND i.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (check.rows.length === 0) {
      throw new AppError('Alert not found or unauthorized', 404);
    }
  }

  const { rows } = await query(
    `UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) throw new AppError('Alert not found', 404);

  // Check if there are any remaining unresolved alerts for this invoice
  const invoiceId = rows[0].invoice_id;
  const remainingRes = await query(
    `SELECT COUNT(*) FROM alerts WHERE invoice_id = $1 AND resolved = FALSE`,
    [invoiceId]
  );
  const remainingCount = parseInt(remainingRes.rows[0].count, 10);

  // If no remaining unresolved alerts and autoVerify is explicitly requested (e.g. 'Approve Invoice'), transition invoice status
  const autoVerify = req.body.autoVerify === true;
  if (remainingCount === 0 && autoVerify) {
    await query(
      `UPDATE invoices SET status = 'verified' WHERE id = $1 AND status IN ('flagged', 'duplicate', 'pending')`,
      // Note: only transitions if autoVerify requested and no remaining alerts
      [invoiceId]
    );
  }

  res.json(rows[0]);
};
