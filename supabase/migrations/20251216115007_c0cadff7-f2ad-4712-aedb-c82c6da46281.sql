-- Fix remaining functions with missing search_path

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_str text;
    counter_val integer;
    order_num text;
BEGIN
    today_str := 'AQVI' || to_char(current_date, 'YYMMDD');
    
    SELECT COALESCE(
        (SELECT MAX(
            CASE 
                WHEN order_number LIKE today_str || '%' 
                THEN CAST(RIGHT(order_number, 4) AS INTEGER) + 1
                ELSE 1001
            END
        ) FROM public.orders 
        WHERE order_number LIKE today_str || '%'), 
        1001
    ) INTO counter_val;
    
    IF counter_val > 9999 THEN
        counter_val := 9999;
    END IF;
    
    order_num := today_str || LPAD(counter_val::text, 4, '0');
    
    RETURN order_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_aquavi_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_date TEXT;
    order_count INTEGER;
    sequence_num TEXT;
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    
    SELECT COUNT(*) INTO order_count
    FROM public.orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    sequence_num := LPAD((1001 + order_count)::TEXT, 4, '0');
    
    RETURN 'AQVI' || today_date || sequence_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := public.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_admin_login(email_input text, password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF email_input = 'admin@aquavi.com' AND password_input = 'AquaVI2024!' THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_session_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;
$$;