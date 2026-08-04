import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

async function run() {
  console.log('Connecting to PostgreSQL database...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    console.log('Injecting missing ENUM values into public.order_status...');
    await sql`ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'completed'`;
    await sql`ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'failed'`;
    await sql`ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded'`;
    console.log('SUCCESS: Updated public.order_status ENUM with "completed", "failed", and "refunded" without touching existing data!');
  } catch (err: any) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
