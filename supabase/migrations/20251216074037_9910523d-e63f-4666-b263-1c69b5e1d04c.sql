-- Fix 1: Add admin check to get_users_with_roles()
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  role text,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Require admin access
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id as id,
    COALESCE(p.email, au.email, 'No email available') as email,
    COALESCE(p.display_name, 'No name set') as display_name,
    p.created_at,
    COALESCE(ur.role, 'user') as role,
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  LEFT JOIN auth.users au ON p.user_id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Fix 2: Create server-side order validation function
CREATE OR REPLACE FUNCTION public.create_validated_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_delivery_type text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric := 0;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_validated_items jsonb := '[]'::jsonb;
  v_receive_orders text;
BEGIN
  -- Check if orders are being accepted
  SELECT setting_value INTO v_receive_orders
  FROM site_settings
  WHERE setting_key = 'receive_orders';
  
  IF v_receive_orders = 'false' THEN
    RAISE EXCEPTION 'Orders are currently not being accepted';
  END IF;

  -- Validate customer name (2-100 characters)
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 OR length(trim(p_customer_name)) > 100 THEN
    RAISE EXCEPTION 'Invalid customer name: must be 2-100 characters';
  END IF;
  
  -- Validate phone (required, 5-20 characters)
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 5 OR length(trim(p_customer_phone)) > 20 THEN
    RAISE EXCEPTION 'Invalid phone number: must be 5-20 characters';
  END IF;
  
  -- Validate email format if provided
  IF p_customer_email IS NOT NULL AND p_customer_email != '' THEN
    IF NOT p_customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    IF length(p_customer_email) > 255 THEN
      RAISE EXCEPTION 'Email too long: maximum 255 characters';
    END IF;
  END IF;
  
  -- Validate delivery address for delivery orders
  IF p_delivery_type = 'delivery' THEN
    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5 OR length(trim(p_delivery_address)) > 500 THEN
      RAISE EXCEPTION 'Invalid delivery address: must be 5-500 characters';
    END IF;
  END IF;
  
  -- Validate delivery type
  IF p_delivery_type NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Invalid delivery type: must be delivery or pickup';
  END IF;
  
  -- Validate payment method
  IF p_payment_method NOT IN ('cash', 'card') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  
  -- Validate items and calculate total server-side
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in order (maximum 50)';
  END IF;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product from database
    SELECT id, name, price, is_active INTO v_product
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;
    
    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product is not available: %', v_product.name;
    END IF;
    
    -- Validate quantity (1-100)
    IF (v_item->>'quantity')::int < 1 OR (v_item->>'quantity')::int > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for %: must be 1-100', v_product.name;
    END IF;
    
    -- Calculate total using DATABASE price (not client-provided)
    v_total := v_total + (v_product.price * (v_item->>'quantity')::int);
    
    -- Build validated item with database values
    v_validated_items := v_validated_items || jsonb_build_object(
      'name', v_product.name,
      'price', v_product.price,
      'quantity', (v_item->>'quantity')::int
    );
  END LOOP;
  
  -- Insert order with server-calculated total
  INSERT INTO orders (
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_type,
    items,
    total_amount,
    status,
    payment_method
  ) VALUES (
    trim(p_customer_name),
    NULLIF(trim(p_customer_email), ''),
    trim(p_customer_phone),
    COALESCE(trim(p_delivery_address), ''),
    p_delivery_type,
    v_validated_items,
    v_total,
    'pending',
    p_payment_method
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'items', v_validated_items
  );
END;
$$;