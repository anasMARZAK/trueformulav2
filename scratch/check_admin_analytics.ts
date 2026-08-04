import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

async function run() {
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });
  try {
    const profiles = await sql`SELECT id, email, role FROM profiles`;
    console.log('Profiles in DB:', profiles);

    const orders = await sql`SELECT id, customer_email, total_amount, status, created_at FROM orders`;
    console.log('Orders count in DB:', orders.length, orders);

    const subs = await sql`SELECT id, user_id, customer_email, status, created_at FROM subscriptions`;
    console.log('Subscriptions count in DB:', subs.length, subs);
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
  } finally {
    await sql.end();
  }
}

run();
