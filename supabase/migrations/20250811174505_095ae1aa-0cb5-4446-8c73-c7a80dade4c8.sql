-- Create a function to generate proper order numbers in AQVIYYMMDD#### format
CREATE OR REPLACE FUNCTION generate_aquavi_order_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    order_count INTEGER;
    sequence_num TEXT;
BEGIN
    -- Get today's date in YYMMDD format
    today_date := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    
    -- Count orders created today
    SELECT COUNT(*) INTO order_count
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Generate sequence number starting from 1001
    sequence_num := LPAD((1001 + order_count)::TEXT, 4, '0');
    
    -- Return the formatted order number
    RETURN 'AQVI' || today_date || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Update the orders table to use the new function for order_number default
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT generate_aquavi_order_number();