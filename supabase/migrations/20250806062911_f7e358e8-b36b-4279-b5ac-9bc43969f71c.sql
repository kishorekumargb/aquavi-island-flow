-- Update existing users to have admin role where appropriate
-- First, ensure the admin@aquavi.com user has an admin role
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '36c07c5f-7b1b-4c5a-8aba-0e4660ee9d03';

-- If no role exists, insert it
INSERT INTO user_roles (user_id, role) 
SELECT '36c07c5f-7b1b-4c5a-8aba-0e4660ee9d03', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = '36c07c5f-7b1b-4c5a-8aba-0e4660ee9d03'
);

-- Also ensure profile exists for admin user
INSERT INTO profiles (user_id, display_name, email) 
SELECT '36c07c5f-7b1b-4c5a-8aba-0e4660ee9d03', 'Admin User', 'admin@aquavi.com'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = '36c07c5f-7b1b-4c5a-8aba-0e4660ee9d03'
);

-- Ensure all existing users without roles get 'user' role
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Ensure all existing users without profiles get basic profiles
INSERT INTO profiles (user_id, display_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)), u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;