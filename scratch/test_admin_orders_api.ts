import { createAdminSupabaseClient } from '@/lib/supabase/server';
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
  console.log('Testing Admin Orders API query...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    const orders = await sql`SELECT * FROM public.orders`;
    console.log('Postgres raw query orders count:', orders.length);

    const items = await sql`SELECT * FROM public.order_items`;
    console.log('Postgres raw query order_items count:', items.length);

    // Now test Supabase JS client with SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key defined?', !!serviceKey);

    const { createClient } = await import('@supabase/supabase-js');
    if (supabaseUrl && serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: sOrders, error: sErr } = await adminClient.from('orders').select('*');
      console.log('Supabase JS Client orders count:', sOrders?.length, 'error:', sErr);
    }
  } catch (err: any) {
    console.error('Test error:', err);
  } finally {
    await sql.end();
  }
}

run();
