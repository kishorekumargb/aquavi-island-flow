-- Create subscriptions table for recurring orders
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  delivery_address text,
  delivery_type text NOT NULL DEFAULT 'delivery',
  frequency text NOT NULL,
  preferred_day text NOT NULL,
  week_of_month integer,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  next_delivery_date date NOT NULL,
  start_date date NOT NULL,
  payment_method text DEFAULT 'cash',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_order_id uuid,
  
  -- Constraints
  CONSTRAINT subscriptions_frequency_check CHECK (frequency IN ('biweekly', 'monthly')),
  CONSTRAINT subscriptions_preferred_day_check CHECK (preferred_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  CONSTRAINT subscriptions_week_of_month_check CHECK (week_of_month IS NULL OR week_of_month BETWEEN 1 AND 4),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'paused', 'cancelled')),
  CONSTRAINT subscriptions_delivery_type_check CHECK (delivery_type IN ('delivery', 'pickup'))
);

-- Add subscription_id column to orders table
ALTER TABLE public.orders ADD COLUMN subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Create index for efficient subscription lookups
CREATE INDEX idx_subscriptions_next_delivery ON public.subscriptions(next_delivery_date) WHERE status = 'active';
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_orders_subscription_id ON public.orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table
-- Public can create subscriptions (like orders)
CREATE POLICY subscriptions_public_insert_policy ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Authenticated users (admin or user role) can view subscriptions
CREATE POLICY subscriptions_authenticated_select_policy ON public.subscriptions
  FOR SELECT USING (is_authenticated_user(auth.uid()) OR is_admin(auth.uid()));

-- Authenticated users can update subscriptions (for pause/resume/cancel)
CREATE POLICY subscriptions_authenticated_update_policy ON public.subscriptions
  FOR UPDATE USING (is_authenticated_user(auth.uid()) OR is_admin(auth.uid()));

-- Only admins can delete subscriptions
CREATE POLICY subscriptions_admin_delete_policy ON public.subscriptions
  FOR DELETE USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate next delivery date
CREATE OR REPLACE FUNCTION public.calculate_next_delivery_date(
  p_frequency text,
  p_preferred_day text,
  p_week_of_month integer,
  p_current_date date
)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_num integer;
  v_next_date date;
  v_first_of_month date;
  v_target_weekday integer;
  v_days_to_add integer;
BEGIN
  -- Map day name to PostgreSQL day number (0=Sunday, 1=Monday, ..., 5=Friday)
  v_target_weekday := CASE p_preferred_day
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
  END;
  
  IF p_frequency = 'biweekly' THEN
    -- For biweekly: add 14 days to current date, then find next preferred day
    v_next_date := p_current_date + 14;
    v_days_to_add := (v_target_weekday - EXTRACT(DOW FROM v_next_date)::integer + 7) % 7;
    IF v_days_to_add = 0 THEN
      v_days_to_add := 0; -- Same day is fine
    END IF;
    v_next_date := v_next_date + v_days_to_add;
    
  ELSIF p_frequency = 'monthly' THEN
    -- For monthly: find the Nth occurrence of the day in the next month
    v_first_of_month := date_trunc('month', p_current_date + interval '1 month')::date;
    
    -- Find first occurrence of the target weekday in that month
    v_days_to_add := (v_target_weekday - EXTRACT(DOW FROM v_first_of_month)::integer + 7) % 7;
    v_next_date := v_first_of_month + v_days_to_add;
    
    -- Add weeks to get to the Nth occurrence
    v_next_date := v_next_date + ((p_week_of_month - 1) * 7);
    
    -- If this pushed us into the next month (e.g., 5th Monday doesn't exist),
    -- fall back to the first occurrence in the following month
    IF EXTRACT(MONTH FROM v_next_date) != EXTRACT(MONTH FROM v_first_of_month) THEN
      v_first_of_month := date_trunc('month', v_first_of_month + interval '1 month')::date;
      v_days_to_add := (v_target_weekday - EXTRACT(DOW FROM v_first_of_month)::integer + 7) % 7;
      v_next_date := v_first_of_month + v_days_to_add;
    END IF;
  END IF;
  
  RETURN v_next_date;
END;
$$;