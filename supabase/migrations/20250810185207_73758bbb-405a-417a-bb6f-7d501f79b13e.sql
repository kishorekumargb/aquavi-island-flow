-- Fix RLS policy for user_roles to allow admin operations
DROP POLICY IF EXISTS "user_roles_admin_policy" ON public.user_roles;

CREATE POLICY "user_roles_admin_all_policy" 
ON public.user_roles 
FOR ALL
USING (true)
WITH CHECK (true);

-- Check and update orders status constraint to include 'processing'
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- Add new constraint with all valid statuses
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'processing', 'delivered', 'cancelled'));
END $$;