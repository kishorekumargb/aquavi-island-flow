-- Fix critical security issue: Restrict access to orders table containing customer PII
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "orders_admin_all_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

-- Create proper RLS policies for orders table
-- Only authenticated admin users can view and manage all orders
CREATE POLICY "orders_admin_select_policy" 
ON public.orders 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "orders_admin_update_policy" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "orders_admin_delete_policy" 
ON public.orders 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow public users to only insert new orders (place orders)
CREATE POLICY "orders_public_insert_policy" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);