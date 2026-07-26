-- =================================================================
-- TRUE FORMULA — SUPABASE POSTGRESQL DATABASE SCHEMA
-- Execute this SQL in the Supabase SQL Editor to set up all tables,
-- RLS security policies, and automatic user profile triggers.
-- =================================================================

-- 1. Create Enums Safely (Ignores error if types already exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. User Profiles Table (Linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'customer'::user_role NOT NULL,
  phone TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  flavors JSONB DEFAULT '["Default"]'::jsonb NOT NULL,
  sizes JSONB DEFAULT '["Standard"]'::jsonb NOT NULL,
  stock INT DEFAULT 100 NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Customer Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending'::order_status NOT NULL,
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  selected_flavor TEXT NOT NULL,
  selected_size TEXT NOT NULL,
  purchase_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  status subscription_status DEFAULT 'active'::subscription_status NOT NULL,
  flavor TEXT NOT NULL,
  size TEXT NOT NULL,
  interval_days INT DEFAULT 30 NOT NULL,
  next_delivery_date TIMESTAMPTZ NOT NULL,
  discount_percentage INT DEFAULT 20 NOT NULL,
  price_per_cycle DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  role_en TEXT NOT NULL,
  role_fr TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text_en TEXT NOT NULL,
  text_fr TEXT NOT NULL,
  product_bought_en TEXT NOT NULL,
  product_bought_fr TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  accent_color TEXT DEFAULT '#2E5A44' NOT NULL,
  is_verified_buyer BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Cart Items Table (Cross-device user cart persistence)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INT DEFAULT 1 NOT NULL,
  selected_flavor TEXT NOT NULL,
  selected_size TEXT NOT NULL,
  purchase_type TEXT DEFAULT 'one_time' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_cart_item UNIQUE(user_id, product_id, selected_flavor, selected_size, purchase_type)
);

-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin products modify" ON public.products;
CREATE POLICY "Admin products modify" ON public.products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Profiles Policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Orders Policies
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users insert orders" ON public.orders;
CREATE POLICY "Users insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Order Items Policies
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ))
  )
);

DROP POLICY IF EXISTS "Users insert order items" ON public.order_items;
CREATE POLICY "Users insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Subscriptions Policies
DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users manage own subscriptions" ON public.subscriptions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage all subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Reviews Policies
DROP POLICY IF EXISTS "Public reviews read" ON public.reviews;
CREATE POLICY "Public reviews read" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert reviews" ON public.reviews;
CREATE POLICY "Users insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Cart Items Policies
DROP POLICY IF EXISTS "Users manage own cart items" ON public.cart_items;
CREATE POLICY "Users manage own cart items" ON public.cart_items FOR ALL USING (user_id = auth.uid());

-- =================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- Automatically creates a profile record when a user signs up via Auth
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
