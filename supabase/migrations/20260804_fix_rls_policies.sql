-- Migration: 20260804_fix_rls_policies.sql
-- Fix infinite recursion in RLS policies for relation "profiles" by using a SECURITY DEFINER helper function.

-- 1. Create SECURITY DEFINER function to bypass RLS during admin check
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

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile non-role fields" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT WITH CHECK (true);

-- 3. Products Policies
DROP POLICY IF EXISTS "Admin products modify" ON public.products;
CREATE POLICY "Admin products modify" ON public.products
FOR ALL USING (is_admin());

-- 4. Orders Policies
DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert orders" ON public.orders;
CREATE POLICY "Admins read all orders" ON public.orders
FOR SELECT USING (is_admin());

CREATE POLICY "Users insert orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- 5. Subscriptions Policies
DROP POLICY IF EXISTS "Admins manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users insert subscriptions" ON public.subscriptions;

CREATE POLICY "Admins manage all subscriptions" ON public.subscriptions
FOR ALL USING (is_admin());

CREATE POLICY "Users insert subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (true);
