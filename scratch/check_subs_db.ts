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
    const subs = await sql`SELECT * FROM public.subscriptions`;
    console.log('Subscriptions in DB count:', subs.length);
    console.log('Subscriptions rows:', JSON.stringify(subs, null, 2));
  } catch (err: any) {
    console.error('Error fetching subscriptions:', err);
  } finally {
    await sql.end();
  }
}

run();
