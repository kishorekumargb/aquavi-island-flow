-- Add delivery_type column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_type text DEFAULT 'delivery';