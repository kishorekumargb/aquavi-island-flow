-- Create a default admin user
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
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user ID and create profile and role
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'admin@aquavi.com';
    
    -- Create profile
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (user_id, 'Admin User');
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'admin');
END $$;