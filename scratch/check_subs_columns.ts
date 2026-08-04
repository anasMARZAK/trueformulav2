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
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
    `;
    console.log('Columns on public.subscriptions:', JSON.stringify(columns, null, 2));
  } catch (err: any) {
    console.error('Error checking columns:', err);
  } finally {
    await sql.end();
  }
}

run();
