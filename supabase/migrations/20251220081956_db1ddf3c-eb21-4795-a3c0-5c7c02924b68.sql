-- ==============================================
-- FIX 1: Server-side contact message validation
-- ==============================================
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name text,
  p_email text,
  p_phone text,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate name (2-100 characters)
  IF p_name IS NULL OR length(trim(p_name)) < 2 OR length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Invalid name: must be 2-100 characters';
  END IF;
  
  -- Validate email format
  IF p_email IS NULL OR NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF length(p_email) > 255 THEN
    RAISE EXCEPTION 'Email too long: maximum 255 characters';
  END IF;
  
  -- Validate phone (5-20 characters if provided)
  IF p_phone IS NOT NULL AND p_phone != '' AND 
     (length(trim(p_phone)) < 5 OR length(trim(p_phone)) > 20) THEN
    RAISE EXCEPTION 'Invalid phone: must be 5-20 characters';
  END IF;
  
  -- Validate message (10-5000 characters)
  IF p_message IS NULL OR length(trim(p_message)) < 10 OR length(trim(p_message)) > 5000 THEN
    RAISE EXCEPTION 'Invalid message: must be 10-5000 characters';
  END IF;
  
  -- Insert validated message
  INSERT INTO contact_messages (name, email, phone, message, status)
  VALUES (trim(p_name), trim(p_email), NULLIF(trim(p_phone), ''), trim(p_message), 'unread');
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================
-- FIX 2: Orders RLS - Restrict to admins only
-- ==============================================
DROP POLICY IF EXISTS "orders_authenticated_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_authenticated_update_policy" ON public.orders;

-- Restrict SELECT to admins only
CREATE POLICY "orders_admin_select_policy" 
ON public.orders 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Restrict UPDATE to admins only
CREATE POLICY "orders_admin_update_policy" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- ==============================================
-- FIX 3: Storage policies - Admin only for products/testimonials
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload testimonial images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update testimonial images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete testimonial images" ON storage.objects;

-- Admin-only policies for products bucket
CREATE POLICY "Admin users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'products' AND is_admin(auth.uid()));

CREATE POLICY "Admin users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'products' AND is_admin(auth.uid()));

CREATE POLICY "Admin users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'products' AND is_admin(auth.uid()));

-- Admin-only policies for testimonials bucket
CREATE POLICY "Admin users can upload testimonial images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'testimonials' AND is_admin(auth.uid()));

CREATE POLICY "Admin users can update testimonial images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'testimonials' AND is_admin(auth.uid()));

CREATE POLICY "Admin users can delete testimonial images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'testimonials' AND is_admin(auth.uid()));