-- Drop existing admin-only update policy
DROP POLICY IF EXISTS "orders_admin_update_policy" ON public.orders;

-- Create new update policy that allows both admins and regular authenticated users to update orders
CREATE POLICY "orders_authenticated_update_policy" 
ON public.orders 
FOR UPDATE 
USING (is_authenticated_user(auth.uid()) OR is_admin(auth.uid()));