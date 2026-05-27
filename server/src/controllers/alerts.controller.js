import { query } from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

/* GET /api/alerts */
export const listAlerts = async (req, res) => {
  const { resolved = 'false' } = req.query;

  const { rows } = await query(
    `SELECT a.*, i.invoice_number, i.supplier_name, i.total_amount
     FROM alerts a
     LEFT JOIN invoices i ON i.id = a.invoice_id
     WHERE a.resolved = $1
     ORDER BY a.created_at DESC`,
    [resolved === 'true']
  );

  res.json(rows);
};

/* PATCH /api/alerts/:id/resolve */
export const resolveAlert = async (req, res) => {
  const { rows } = await query(
    `UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) throw new AppError('Alert not found', 404);
  res.json(rows[0]);
};
