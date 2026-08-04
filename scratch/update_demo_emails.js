const postgres = require('postgres');
const fs = require('fs');

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
    console.log('Cleaning up duplicate auth users and updating demo emails...');

    // Delete temporary auto-created users from previous demo clicks
    await sql`DELETE FROM auth.users WHERE email = 'admin@trueformula.io' AND id != '00000000-0000-4000-a000-000000000002'`;
    await sql`DELETE FROM auth.users WHERE email = 'customer@trueformula.io' AND id != '00000000-0000-4000-a000-000000000001'`;

    // Now update official demo accounts to @trueformula.io
    await sql`UPDATE auth.users SET email = 'admin@trueformula.io' WHERE id = '00000000-0000-4000-a000-000000000002' OR email = 'admin@bioluxe.io'`;
    await sql`UPDATE auth.users SET email = 'customer@trueformula.io' WHERE id = '00000000-0000-4000-a000-000000000001' OR email = 'customer@bioluxe.io'`;

    // Update profiles
    await sql`UPDATE public.profiles SET email = 'admin@trueformula.io', role = 'admin' WHERE id = '00000000-0000-4000-a000-000000000002'`;
    await sql`UPDATE public.profiles SET email = 'customer@trueformula.io', role = 'customer' WHERE id = '00000000-0000-4000-a000-000000000001'`;
    
    // Also update any other admin profiles to ensure role is admin
    await sql`UPDATE public.profiles SET role = 'admin' WHERE email LIKE '%admin%'`;

    const updatedProfiles = await sql`SELECT id, email, role, full_name FROM public.profiles`;
    console.log('UPDATED PROFILES:', updatedProfiles);
    const updatedUsers = await sql`SELECT id, email FROM auth.users`;
    console.log('UPDATED AUTH USERS:', updatedUsers);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}
run();
