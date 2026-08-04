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
  console.log('Connecting to PostgreSQL database to fix RLS infinite recursion...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    // 1. Create SECURITY DEFINER function for is_admin to prevent RLS policy recursion
    await sql`
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        );
      $$;
    `;
    console.log('Created security definer function public.is_admin()');

    // 2. Drop recursive policies on profiles
    await sql`DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles`;
    await sql`DROP POLICY IF EXISTS "Users can update own profile non-role fields" ON public.profiles`;
    await sql`DROP POLICY IF EXISTS "Users read own profile" ON public.profiles`;
    await sql`DROP POLICY IF EXISTS "Users update own profile" ON public.profiles`;

    // Re-create clean, non-recursive policies on profiles
    await sql`
      CREATE POLICY "Users read own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id OR is_admin());
    `;

    await sql`
      CREATE POLICY "Users update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    `;

    await sql`
      CREATE POLICY "Users insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (true);
    `;

    // 3. Drop & recreate non-recursive policies on products
    await sql`DROP POLICY IF EXISTS "Admin products modify" ON public.products`;
    await sql`
      CREATE POLICY "Admin products modify" ON public.products
      FOR ALL USING (is_admin());
    `;

    // 4. Drop & recreate non-recursive policies on orders
    await sql`DROP POLICY IF EXISTS "Admins read all orders" ON public.orders`;
    await sql`DROP POLICY IF EXISTS "Users insert orders" ON public.orders`;
    await sql`
      CREATE POLICY "Admins read all orders" ON public.orders
      FOR SELECT USING (is_admin());
    `;
    await sql`
      CREATE POLICY "Users insert orders" ON public.orders
      FOR INSERT WITH CHECK (true);
    `;

    // 5. Subscriptions Policies
    await sql`DROP POLICY IF EXISTS "Admins manage all subscriptions" ON public.subscriptions`;
    await sql`DROP POLICY IF EXISTS "Users insert subscriptions" ON public.subscriptions`;
    await sql`
      CREATE POLICY "Admins manage all subscriptions" ON public.subscriptions
      FOR ALL USING (is_admin());
    `;
    await sql`
      CREATE POLICY "Users insert subscriptions" ON public.subscriptions
      FOR INSERT WITH CHECK (true);
    `;

    console.log('SUCCESS: All RLS policies fixed and infinite recursion eliminated!');
  } catch (err: any) {
    console.error('Error fixing RLS policies:', err.message);
  } finally {
    await sql.end();
  }
}

run();
