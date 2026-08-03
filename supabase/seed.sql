-- Seed Script for Supabase Auth, Identities & Profiles (Phase 0.5 / FIND-04)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Seed Auth Users in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES
(
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'customer@bioluxe.io',
  crypt('Customer123!', gen_salt('bf', 10)),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Jane Doe"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'admin@bioluxe.io',
  crypt('Admin123!', gen_salt('bf', 10)),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Store Admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW();

-- 2. Create matching rows in auth.identities
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
VALUES
(
  gen_random_uuid(),
  '00000000-0000-4000-a000-000000000001'::uuid,
  '{"sub": "00000000-0000-4000-a000-000000000001", "email": "customer@bioluxe.io", "full_name": "Jane Doe", "email_verified": true}'::jsonb,
  'email',
  '00000000-0000-4000-a000-000000000001',
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-4000-a000-000000000002'::uuid,
  '{"sub": "00000000-0000-4000-a000-000000000002", "email": "admin@bioluxe.io", "full_name": "Store Admin", "email_verified": true}'::jsonb,
  'email',
  '00000000-0000-4000-a000-000000000002',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- 3. Upsert matching rows in public.profiles with valid UUIDs
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES
(
  '00000000-0000-4000-a000-000000000001',
  'customer@bioluxe.io',
  'Jane Doe',
  'customer',
  NOW()
),
(
  '00000000-0000-4000-a000-000000000002',
  'admin@bioluxe.io',
  'Store Admin',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
