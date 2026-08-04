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
    const orders = await sql`SELECT id, user_id, customer_email, total_amount, status, created_at FROM public.orders`;
    console.log('Orders in Supabase DB:', JSON.stringify(orders, null, 2));
  } catch (err: any) {
    console.error('Error fetching orders:', err);
  } finally {
    await sql.end();
  }
}

run();
