-- Create subscription creation RPC function
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_delivery_address text,
  p_delivery_type text,
  p_frequency text,
  p_preferred_day text,
  p_week_of_month integer,
  p_start_date date,
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
  v_subscription_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_validated_items jsonb := '[]'::jsonb;
  v_receive_orders text;
  v_next_delivery_date date;
  v_first_delivery_date date;
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
  END IF;
  
  -- Validate delivery address for delivery subscriptions
  IF p_delivery_type = 'delivery' THEN
    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5 THEN
      RAISE EXCEPTION 'Invalid delivery address: must be at least 5 characters';
    END IF;
  END IF;
  
  -- Validate delivery type
  IF p_delivery_type NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Invalid delivery type: must be delivery or pickup';
  END IF;
  
  -- Validate frequency
  IF p_frequency NOT IN ('biweekly', 'monthly') THEN
    RAISE EXCEPTION 'Invalid frequency: must be biweekly or monthly';
  END IF;
  
  -- Validate preferred day
  IF p_preferred_day NOT IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday') THEN
    RAISE EXCEPTION 'Invalid preferred day: must be monday through friday';
  END IF;
  
  -- Validate week_of_month for monthly subscriptions
  IF p_frequency = 'monthly' AND (p_week_of_month IS NULL OR p_week_of_month NOT BETWEEN 1 AND 4) THEN
    RAISE EXCEPTION 'Invalid week of month: must be 1-4 for monthly subscriptions';
  END IF;
  
  -- Validate start date
  IF p_start_date IS NULL OR p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Start date must be today or in the future';
  END IF;
  
  -- Validate items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Subscription must contain at least one item';
  END IF;
  
  -- Validate items and calculate total server-side
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, is_active INTO v_product
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;
    
    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product is not available: %', v_product.name;
    END IF;
    
    IF (v_item->>'quantity')::int < 1 OR (v_item->>'quantity')::int > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for %: must be 1-100', v_product.name;
    END IF;
    
    v_total := v_total + (v_product.price * (v_item->>'quantity')::int);
    
    v_validated_items := v_validated_items || jsonb_build_object(
      'name', v_product.name,
      'price', v_product.price,
      'quantity', (v_item->>'quantity')::int
    );
  END LOOP;
  
  -- Calculate first delivery date (adjust start_date to next preferred day if needed)
  v_first_delivery_date := p_start_date;
  
  -- If start_date is not on the preferred day, find the next occurrence
  DECLARE
    v_target_dow integer;
    v_current_dow integer;
    v_days_to_add integer;
  BEGIN
    v_target_dow := CASE p_preferred_day
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
    END;
    
    v_current_dow := EXTRACT(DOW FROM p_start_date)::integer;
    
    IF v_current_dow != v_target_dow THEN
      v_days_to_add := (v_target_dow - v_current_dow + 7) % 7;
      IF v_days_to_add = 0 THEN v_days_to_add := 7; END IF;
      v_first_delivery_date := p_start_date + v_days_to_add;
    END IF;
  END;
  
  -- Calculate next delivery date after first delivery
  v_next_delivery_date := calculate_next_delivery_date(p_frequency, p_preferred_day, p_week_of_month, v_first_delivery_date);
  
  -- Create subscription
  INSERT INTO subscriptions (
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_type,
    frequency,
    preferred_day,
    week_of_month,
    items,
    total_amount,
    status,
    next_delivery_date,
    start_date,
    payment_method
  ) VALUES (
    trim(p_customer_name),
    NULLIF(trim(p_customer_email), ''),
    trim(p_customer_phone),
    COALESCE(trim(p_delivery_address), ''),
    p_delivery_type,
    p_frequency,
    p_preferred_day,
    p_week_of_month,
    v_validated_items,
    v_total,
    'active',
    v_next_delivery_date,
    v_first_delivery_date,
    p_payment_method
  )
  RETURNING id INTO v_subscription_id;
  
  -- Generate first order immediately
  INSERT INTO orders (
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_type,
    items,
    total_amount,
    status,
    payment_method,
    subscription_id
  ) VALUES (
    trim(p_customer_name),
    NULLIF(trim(p_customer_email), ''),
    trim(p_customer_phone),
    COALESCE(trim(p_delivery_address), ''),
    p_delivery_type,
    v_validated_items,
    v_total,
    'pending',
    p_payment_method,
    v_subscription_id
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Update subscription with last_order_id
  UPDATE subscriptions 
  SET last_order_id = v_order_id 
  WHERE id = v_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'items', v_validated_items,
    'first_delivery_date', v_first_delivery_date,
    'next_delivery_date', v_next_delivery_date,
    'frequency', p_frequency
  );
END;
$$;