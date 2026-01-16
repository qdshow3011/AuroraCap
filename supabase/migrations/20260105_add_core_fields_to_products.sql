-- Add core_assets and core_strategy fields to products table
ALTER TABLE public.products ADD COLUMN core_assets TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN core_strategy TEXT DEFAULT '';
