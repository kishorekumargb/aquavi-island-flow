-- Clean up legacy duplicate data from site_settings table
-- Keep only 'receive_orders' which is the only setting actively used
-- All public display settings now come from public_site_config table

DELETE FROM public.site_settings 
WHERE setting_key NOT IN ('receive_orders');