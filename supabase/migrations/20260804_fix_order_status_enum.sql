-- Migration: 20260804_fix_order_status_enum.sql
-- Add completed, failed, and refunded to order_status enum if not present

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded';
