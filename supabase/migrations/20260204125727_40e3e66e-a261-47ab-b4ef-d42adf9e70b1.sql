-- Create RPC function to generate an order from an active subscription
-- This handles order creation and next_delivery_date recalculation atomically

CREATE OR REPLACE FUNCTION public.generate_order_from_subscription(p_subscription_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription record;
  v_order_id uuid;
  v_order_number text;
  v_next_delivery_date date;
BEGIN
  -- Lock and fetch the subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;
  
  -- Validate subscription exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Validate subscription is active
  IF v_subscription.status != 'active' THEN
    RAISE EXCEPTION 'Subscription is not active (status: %)', v_subscription.status;
  END IF;
  
  -- Create the new order
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
    v_subscription.customer_name,
    v_subscription.customer_email,
    v_subscription.customer_phone,
    COALESCE(v_subscription.delivery_address, ''),
    v_subscription.delivery_type,
    v_subscription.items,
    v_subscription.total_amount,
    'pending',
    v_subscription.payment_method,
    v_subscription.id
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Calculate the next delivery date based on the current next_delivery_date
  v_next_delivery_date := calculate_next_delivery_date(
    v_subscription.frequency,
    v_subscription.preferred_day,
    COALESCE(v_subscription.week_of_month, 1),
    v_subscription.next_delivery_date::date
  );
  
  -- Update subscription with new next_delivery_date and last_order_id
  UPDATE subscriptions
  SET 
    next_delivery_date = v_next_delivery_date,
    last_order_id = v_order_id,
    updated_at = now()
  WHERE id = p_subscription_id;
  
  -- Return order details
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subscription_id', p_subscription_id,
    'customer_name', v_subscription.customer_name,
    'customer_email', v_subscription.customer_email,
    'total_amount', v_subscription.total_amount,
    'items', v_subscription.items,
    'delivery_type', v_subscription.delivery_type,
    'delivery_address', v_subscription.delivery_address,
    'previous_delivery_date', v_subscription.next_delivery_date,
    'next_delivery_date', v_next_delivery_date
  );
END;
$function$;