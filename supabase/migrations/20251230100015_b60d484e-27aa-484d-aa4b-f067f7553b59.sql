-- Fix overly permissive RLS policies that allow privilege escalation
-- This migration restricts admin-only operations to actual admin users

-- 1. Fix products table RLS - remove overly permissive policy
DROP POLICY IF EXISTS "products_admin_policy" ON public.products;

CREATE POLICY "products_admin_all_policy" 
ON public.products 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Fix testimonials table RLS - remove overly permissive policy
DROP POLICY IF EXISTS "testimonials_admin_policy" ON public.testimonials;

CREATE POLICY "testimonials_admin_all_policy" 
ON public.testimonials 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 3. Fix site_settings table RLS - remove overly permissive policy
DROP POLICY IF EXISTS "site_settings_admin_policy" ON public.site_settings;

CREATE POLICY "site_settings_admin_all_policy" 
ON public.site_settings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 4. Fix user_roles table RLS (MOST CRITICAL) - prevent privilege escalation
DROP POLICY IF EXISTS "user_roles_admin_all_policy" ON public.user_roles;

CREATE POLICY "user_roles_admin_management_policy" 
ON public.user_roles 
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));