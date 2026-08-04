import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf8');
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
    const profiles = await sql`SELECT id, email, role, full_name FROM public.profiles`;
    console.log('PROFILES IN DB:', JSON.stringify(profiles, null, 2));
    const authUsers = await sql`SELECT id, email FROM auth.users`;
    console.log('AUTH USERS IN DB:', JSON.stringify(authUsers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
