import 'dotenv/config';
import { query } from './src/config/db.js';

async function inspect() {
  const users = await query("SELECT id, name, email FROM users");
  for (const u of users.rows) {
    const [cRes, tRes] = await Promise.all([
      query("SELECT COUNT(*) FROM invoices WHERE user_id = $1", [u.id]),
      query("SELECT SUM(total_amount) FROM invoices WHERE user_id = $1", [u.id])
    ]);
    console.log(`User: ${u.name} (${u.email}) -> Count: ${cRes.rows[0].count}, Total: ${tRes.rows[0].sum}`);
  }
}

inspect();
