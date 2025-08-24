-- Fix RLS policy issue for orders table
-- The current policy seems to be blocking public order insertion
-- Let's check the current policies and fix them

-- Drop existing problematic policies
DROP POLICY IF EXISTS "orders_public_insert_policy" ON public.orders;

-- Create a proper public insert policy for orders
CREATE POLICY "orders_public_insert_policy" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Ensure the policy allows all users to insert orders (as they should be able to place orders)
-- The policy should not require authentication for order placement