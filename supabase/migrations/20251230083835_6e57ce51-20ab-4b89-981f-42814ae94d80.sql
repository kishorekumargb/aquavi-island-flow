-- Add display_order column for manual product ordering
ALTER TABLE public.products ADD COLUMN display_order integer DEFAULT 0;

-- Set initial display order based on current price order
WITH ordered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY price ASC) as rn
  FROM public.products
)
UPDATE public.products p
SET display_order = op.rn
FROM ordered_products op
WHERE p.id = op.id;