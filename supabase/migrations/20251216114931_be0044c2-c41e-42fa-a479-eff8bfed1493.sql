-- Create a function to check if user is authenticated with any role (admin or user)
CREATE OR REPLACE FUNCTION public.is_authenticated_user(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role IN ('admin', 'user')
  );
$$;

-- Drop the old restrictive admin-only select policy
DROP POLICY IF EXISTS "orders_admin_select_policy" ON public.orders;

-- Create new policy that allows both admins and regular users to view orders
CREATE POLICY "orders_authenticated_select_policy" 
ON public.orders 
FOR SELECT 
USING (is_authenticated_user(auth.uid()));

-- Also fix the update policy to allow regular users to update order status
DROP POLICY IF EXISTS "orders_admin_update_policy" ON public.orders;

CREATE POLICY "orders_authenticated_update_policy" 
ON public.orders 
FOR UPDATE 
USING (is_authenticated_user(auth.uid()));

-- Keep delete as admin-only (this is already correct)
-- orders_admin_delete_policy remains unchanged

-- Also fix functions with missing search_path to address linter warnings
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;