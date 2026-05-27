import pg from 'pg';
const { Pool } = pg;

// Supabase requires SSL in ALL environments (dev + prod).
// rejectUnauthorized: false trusts Supabase's self-signed cert.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});


pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text, params) => pool.query(text, params);

/** Call once at startup to verify the DB is reachable. */
export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ Connected to Supabase PostgreSQL');

    // ── Schema migrations (idempotent) ──────────────────────────────
    console.log('🔄 Checking database schemas...');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_verified        BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(6);
    `);

    // Allow 'duplicate' as an invoice status (drop old constraint, re-add with new value)
    await client.query(`
      ALTER TABLE invoices
        DROP CONSTRAINT IF EXISTS invoices_status_check;
      ALTER TABLE invoices
        ADD CONSTRAINT invoices_status_check
        CHECK (status IN ('pending','verified','paid','flagged','duplicate'));
    `);

    // Ensure alerts have a unique constraint on (invoice_id, type) for ON CONFLICT
    await client.query(`
      ALTER TABLE alerts
        DROP CONSTRAINT IF EXISTS alerts_invoice_id_type_key;
      ALTER TABLE alerts
        ADD CONSTRAINT alerts_invoice_id_type_key UNIQUE (invoice_id, type);
    `);

    // ── Status sync (on restart, correct any inconsistent statuses) ─
    console.log('🔄 Syncing invoice statuses...');

    // 'flagged' invoices with no unresolved high_value alerts → verified
    await client.query(`
      UPDATE invoices SET status = 'verified'
      WHERE status = 'flagged'
        AND id NOT IN (
          SELECT DISTINCT invoice_id FROM alerts
          WHERE resolved = FALSE AND type = 'high_value'
        );
    `);

    // 'duplicate' invoices with no unresolved duplicate alerts → verified
    await client.query(`
      UPDATE invoices SET status = 'verified'
      WHERE status = 'duplicate'
        AND id NOT IN (
          SELECT DISTINCT invoice_id FROM alerts
          WHERE resolved = FALSE AND type = 'duplicate'
        );
    `);

    // 'pending' invoices with no unresolved missing_field alerts → verified
    // (only if they also have no other anomaly alerts)
    await client.query(`
      UPDATE invoices SET status = 'verified'
      WHERE status = 'pending'
        AND id NOT IN (
          SELECT DISTINCT invoice_id FROM alerts WHERE resolved = FALSE
        );
    `);

    console.log('💾 Database schema verified');
  } finally {
    client.release();
  }
}

export default pool;
