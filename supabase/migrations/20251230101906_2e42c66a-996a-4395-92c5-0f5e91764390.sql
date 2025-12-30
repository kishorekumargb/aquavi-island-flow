-- Fix 1: Update handle_new_user() with proper search_path and explicit role validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert profile with display name from metadata
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name', NEW.email);
  
  -- SECURITY: Only assign 'user' role during auto-provisioning
  -- This prevents any privilege escalation attempts
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Fix 2: Add column to track confirmation email sent timestamp to prevent duplicate emails
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;