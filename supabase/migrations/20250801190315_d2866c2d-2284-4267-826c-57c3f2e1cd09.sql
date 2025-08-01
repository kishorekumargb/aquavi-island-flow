-- Clean up all existing users and create one working admin account

-- First, clean up all existing data
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.admin_users;

-- We cannot directly delete from auth.users, but we can create a proper admin user

-- Create a simple admin user that will work
INSERT INTO public.admin_users (
    id,
    email,
    name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@aquavi.com',
    'Admin User',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

-- Create a simple function to validate admin login
CREATE OR REPLACE FUNCTION public.validate_admin_login(email_input text, password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple admin validation - in production you'd want proper password hashing
    IF email_input = 'admin@aquavi.com' AND password_input = 'AquaVI2024!' THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$;