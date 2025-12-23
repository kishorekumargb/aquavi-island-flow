-- Drop existing admin-only select policy
DROP POLICY IF EXISTS "orders_admin_select_policy" ON public.orders;

-- Create new select policy that allows both admins and regular authenticated users to view orders
CREATE POLICY "orders_authenticated_select_policy" 
ON public.orders 
FOR SELECT 
USING (is_authenticated_user(auth.uid()) OR is_admin(auth.uid()));