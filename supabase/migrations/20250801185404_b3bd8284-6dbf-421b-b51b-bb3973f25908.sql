-- First, let's ensure we have the admin user properly created
-- Insert into auth.users with proper authentication
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@aquavi.com';
    
    -- If admin doesn't exist, create one
    IF admin_user_id IS NULL THEN
        -- Insert admin user with proper authentication data
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@aquavi.com',
            crypt('AquaVI2024!', gen_salt('bf')),
            NOW(),
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{"display_name":"Admin User"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Create profile for admin
        INSERT INTO public.profiles (user_id, display_name)
        VALUES (admin_user_id, 'Admin User')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Assign admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        -- Admin exists, just ensure they have the right role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;