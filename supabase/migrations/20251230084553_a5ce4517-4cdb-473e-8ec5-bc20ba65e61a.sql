-- Add is_popular column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;

-- Set initial value based on display_order (first product as popular for now)
UPDATE public.products SET is_popular = false;