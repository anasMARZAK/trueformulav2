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
  console.log('Connecting to PostgreSQL database to add missing subscription columns...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_delivery_date TIMESTAMPTZ`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS shipping_address JSONB`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS selected_flavor TEXT`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS selected_size TEXT`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS flavor TEXT`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS size TEXT`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_per_billing DECIMAL(10, 2)`;
    await sql`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_per_cycle DECIMAL(10, 2)`;
    
    // Copy existing next_delivery_date to next_billing_date if null
    await sql`UPDATE public.subscriptions SET next_billing_date = next_delivery_date WHERE next_billing_date IS NULL AND next_delivery_date IS NOT NULL`;
    await sql`UPDATE public.subscriptions SET next_delivery_date = next_billing_date WHERE next_delivery_date IS NULL AND next_billing_date IS NOT NULL`;

    console.log('SUCCESS: All subscriptions table columns synchronized successfully!');
  } catch (err: any) {
    console.error('Error updating subscriptions columns:', err.message);
  } finally {
    await sql.end();
  }
}

run();
