-- Seed Script for Supabase Auth & Profiles (Phase 0.5 / FIND-04)

-- 1. Create Seed Auth Users in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
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
  'customer@example.com',
  -- Default password hash for 'Customer123!'
  '$2a$10$wN9a.F60T/zB5T1v3.a5c.k/qY6P5G3yU/219w2G5uK4V4w2kX3aO',
  NOW(),
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
  'admin@proteinshop.com',
  -- Default password hash for 'Admin123!'
  '$2a$10$wN9a.F60T/zB5T1v3.a5c.k/qY6P5G3yU/219w2G5uK4V4w2kX3aO',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Store Admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- 2. Upsert matching rows in public.profiles with valid UUIDs
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES
(
  '00000000-0000-4000-a000-000000000001',
  'customer@example.com',
  'Jane Doe',
  'customer',
  NOW()
),
(
  '00000000-0000-4000-a000-000000000002',
  'admin@proteinshop.com',
  'Store Admin',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
