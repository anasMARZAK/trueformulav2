-- Migration: 20260807_product_media.sql
-- Adds a public storage bucket for product photography plus a media-library
-- table, so uploaded images are named, listable, and reusable across products
-- instead of being one-off paths typed into a text field.

-- 1. Public bucket for product imagery.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Anyone may read the bucket (product photos appear on the public storefront).
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Writes go through the admin API using the service role key, which bypasses
-- RLS — no INSERT/UPDATE/DELETE policy is granted to anon or authenticated.

-- 3. Media library: the catalog of uploaded assets with a human-readable name,
--    so an image can be found and re-selected later.
CREATE TABLE IF NOT EXISTS public.product_media (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  storage_path text NOT NULL,
  url          text NOT NULL,
  mime_type    text,
  size_bytes   integer,
  width        integer,
  height       integer,
  -- profiles.id is a uuid (it mirrors auth.users.id), so this column must match.
  uploaded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_media_created_at_idx
  ON public.product_media (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS product_media_storage_path_idx
  ON public.product_media (storage_path);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- The library is readable by the storefront so a product page can resolve an
-- asset by id; mutations are service-role only, matching the products table.
DROP POLICY IF EXISTS "Public can view product media" ON public.product_media;
CREATE POLICY "Public can view product media"
  ON public.product_media FOR SELECT
  USING (true);
