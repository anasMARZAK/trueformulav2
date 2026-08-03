-- Migration: 20260803_schema_foundation.sql
-- Subscriptions schema, cents columns, popularity score, and order idempotency key

-- 1. Create Enums if not present
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchase_type AS ENUM ('one_time', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Subscriptions Table Schema (with integer cents)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id),
  status subscription_status NOT NULL DEFAULT 'active',
  discount_percentage INTEGER NOT NULL DEFAULT 20,
  price_per_cycle_cents INTEGER NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 30,
  next_billing_date TIMESTAMPTZ NOT NULL,
  selected_flavor TEXT,
  selected_size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- Ensure integer cents & required columns exist on subscriptions if table previously created
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_per_cycle_cents INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 20;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Products Table Additions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_cents INTEGER;

-- 4. Orders Table Additions (Idempotency Key & Cents)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cents INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cents INTEGER;

-- 5. Order Items Table Additions (Cents & Variants)
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_flavor TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_size TEXT;
