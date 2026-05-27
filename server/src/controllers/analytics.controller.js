import { query } from '../config/db.js';

/* GET /api/analytics/summary */
export const getSummary = async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  const where  = userId ? `WHERE user_id = $1` : '';
  const params = userId ? [userId] : [];

  const [countRes, totalRes, pendingRes, flaggedRes] = await Promise.all([
    query(`SELECT COUNT(*)                             FROM invoices ${where}`, params),
    query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM invoices ${where}`, params),
    query(`SELECT COUNT(*) FROM invoices ${where ? where + ' AND' : 'WHERE'} status='pending'`, params),
    query(`SELECT COUNT(*) FROM invoices ${where ? where + ' AND' : 'WHERE'} status='flagged'`, params),
  ]);

  res.json({
    totalInvoices:   parseInt(countRes.rows[0].count),
    totalExpenses:   parseFloat(totalRes.rows[0].total),
    pendingInvoices: parseInt(pendingRes.rows[0].count),
    flaggedInvoices: parseInt(flaggedRes.rows[0].count),
  });
};

/* GET /api/analytics/monthly */
export const getMonthlyTrend = async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  const where  = userId ? `WHERE user_id = $1` : '';
  const params = userId ? [userId] : [];

  const { rows } = await query(
    `SELECT
       TO_CHAR(invoice_date, 'YYYY-MM') AS month,
       COUNT(*)                         AS count,
       COALESCE(SUM(total_amount), 0)   AS total
     FROM invoices
     ${where}
     GROUP BY month
     ORDER BY month DESC
     LIMIT 12`,
    params
  );

  res.json(rows.reverse()); // chronological order for charts
};

/* GET /api/analytics/by-supplier */
export const getBySupplier = async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  const where  = userId ? `WHERE user_id = $1` : '';
  const params = userId ? [userId] : [];

  const { rows } = await query(
    `SELECT
       COALESCE(supplier_name, 'Unknown') AS supplier,
       COUNT(*)                           AS count,
       COALESCE(SUM(total_amount), 0)     AS total
     FROM invoices
     ${where}
     GROUP BY supplier
     ORDER BY total DESC
     LIMIT 10`,
    params
  );

  res.json(rows);
};

/* GET /api/analytics/by-status */
export const getByStatus = async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  const where  = userId ? `WHERE user_id = $1` : '';
  const params = userId ? [userId] : [];

  const { rows } = await query(
    `SELECT status, COUNT(*) AS count FROM invoices ${where} GROUP BY status`,
    params
  );

  res.json(rows);
};

/* GET /api/analytics/by-category */
export const getByCategory = async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  const where  = userId ? `WHERE user_id = $1` : '';
  const params = userId ? [userId] : [];

  const { rows } = await query(
    `SELECT
       category,
       COUNT(*)                       AS count,
       COALESCE(SUM(total_amount), 0) AS total
     FROM invoices
     ${where}
     GROUP BY category
     ORDER BY total DESC`,
    params
  );

  res.json(rows);
};
