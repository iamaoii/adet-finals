import pg from 'pg';
const { Pool } = pg;

// Supabase requires SSL in ALL environments (dev + prod).
// rejectUnauthorized: false trusts Supabase's self-signed cert.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
  } finally {
    client.release();
  }
}

export default pool;
