-- Clean up unused tables if they exist
-- First, let's check what data exists and clean up if needed

-- Remove admin_users table if it's not being used properly
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- The profiles and user_roles tables are being used, so keep them
-- But ensure proper structure for profiles table
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure user_roles has proper constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add email field to profiles table for easier user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;