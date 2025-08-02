-- Fix the order number generation function to use proper format AQVIYYMMDD####
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    today_str text;
    counter_val integer;
    order_num text;
BEGIN
    -- Format: AQVIYYMMDD#### (e.g., AQVI25080201001)
    today_str := 'AQVI' || to_char(current_date, 'YYMMDD');
    
    -- Get the next counter for today, starting from 1001
    SELECT COALESCE(
        (SELECT MAX(
            CASE 
                WHEN order_number LIKE today_str || '%' 
                THEN CAST(RIGHT(order_number, 4) AS INTEGER) + 1
                ELSE 1001
            END
        ) FROM orders 
        WHERE order_number LIKE today_str || '%'), 
        1001
    ) INTO counter_val;
    
    -- Ensure counter stays within 1001-9999 range
    IF counter_val > 9999 THEN
        counter_val := 9999;
    END IF;
    
    -- Format with 4 digits
    order_num := today_str || LPAD(counter_val::text, 4, '0');
    
    RETURN order_num;
END;
$function$;

-- Update existing orders with wrong format (optional, comment out if you want to keep existing orders)
-- UPDATE orders SET order_number = public.generate_order_number() WHERE order_number LIKE 'AQ%' AND order_number NOT LIKE 'AQVI______%';