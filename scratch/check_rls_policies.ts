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
    const policies = await sql`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `;
    console.log('Current RLS policies in DB:', JSON.stringify(policies, null, 2));
  } catch (err: any) {
    console.error('Error fetching policies:', err);
  } finally {
    await sql.end();
  }
}

run();
