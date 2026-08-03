import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahgzohemtjzawrdkuprf.supabase.co';
// We can use postgres or service role key if available, or postgres direct update
import postgres from 'postgres';

const dbPassword = 'AQwtcoDeVC42cuto';
const connStr = `postgres://postgres.ahgzohemtjzawrdkuprf:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

async function fixDemoUsers() {
  const sql = postgres(connStr, { ssl: 'require' });

  // Use pgcrypto extensions to set proper bcrypt password hash for 'Customer123!' and 'Admin123!'
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    
    // Hash 'Customer123!'
    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt('Customer123!', gen_salt('bf')),
          email_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE email = 'customer@example.com';
    `;

    // Hash 'Admin123!'
    await sql`
      UPDATE auth.users
      SET encrypted_password = crypt('Admin123!', gen_salt('bf')),
          email_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE email = 'admin@proteinshop.com';
    `;

    console.log('✓ Demo user passwords successfully updated with live pgcrypto bcrypt hash!');
  } catch (err: any) {
    console.error('Error updating demo passwords:', err.message);
  } finally {
    await sql.end();
  }
}

fixDemoUsers();
