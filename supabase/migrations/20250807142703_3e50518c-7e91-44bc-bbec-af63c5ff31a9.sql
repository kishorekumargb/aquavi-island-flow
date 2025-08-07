-- Create a function to get users with their roles and email data
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  role text,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id as id,
    COALESCE(p.email, au.email, 'No email available') as email,
    COALESCE(p.display_name, 'No name set') as display_name,
    p.created_at,
    COALESCE(ur.role, 'user') as role,
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  LEFT JOIN auth.users au ON p.user_id = au.id
  ORDER BY p.created_at DESC;
END;
$$;