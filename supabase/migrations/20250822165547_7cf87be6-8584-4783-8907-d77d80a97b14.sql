-- Add receive orders setting to site_settings if it doesn't exist
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('receive_orders', 'true') 
ON CONFLICT (setting_key) DO NOTHING;