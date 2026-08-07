/**
 * Applies supabase/migrations/20260807_product_media.sql to the live database:
 * the product-images storage bucket, its public read policy, and the
 * product_media library table.
 *
 *   npx tsx scratch/apply_product_media.ts
 */
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

if (!dbUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

async function run() {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260807_product_media.sql'
  );
  const migration = fs.readFileSync(migrationPath, 'utf8');

  console.log('Connecting to PostgreSQL database...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    console.log('Applying 20260807_product_media.sql...');
    await sql.unsafe(migration);
    console.log('SUCCESS: product-images bucket and product_media table are ready.');
  } catch (err: any) {
    console.error('Migration error:', err.message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

run();
