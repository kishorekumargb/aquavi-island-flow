-- Fix critical security issue: Restrict access to site_settings table containing sensitive business data
-- Drop the overly permissive public select policy
DROP POLICY IF EXISTS "site_settings_select_policy" ON public.site_settings;

-- Create a new table for publicly accessible, non-sensitive site configuration
CREATE TABLE IF NOT EXISTS public.public_site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new public config table
ALTER TABLE public.public_site_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the public config table
CREATE POLICY "public_site_config_select_policy" 
ON public.public_site_config 
FOR SELECT 
USING (true);

-- Only admins can manage public site config
CREATE POLICY "public_site_config_admin_policy" 
ON public.public_site_config 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Migrate non-sensitive display data to the new public table
INSERT INTO public.public_site_config (setting_key, setting_value)
SELECT setting_key, setting_value 
FROM public.site_settings 
WHERE setting_key IN (
  'phone',
  'email', 
  'address',
  'delivery_hours',
  'business_hours_monday_friday',
  'business_hours_saturday',
  'business_hours_sunday',
  'logo_url',
  'hero_image_url'
)
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Add trigger for automatic timestamp updates on public config
CREATE TRIGGER update_public_site_config_updated_at
BEFORE UPDATE ON public.public_site_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();