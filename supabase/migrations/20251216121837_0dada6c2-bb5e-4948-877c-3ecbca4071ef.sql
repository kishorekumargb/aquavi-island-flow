-- Step 1: Remove orphaned user_roles entries (users without profiles)
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

-- Step 2: Remove Mohan's admin role (keep only user)
DELETE FROM public.user_roles 
WHERE user_id = 'c4160443-eac0-46bf-890b-bf1d32e4fa53' 
AND role = 'admin';

-- Step 3: Remove Kishore's user role (keep only admin)
DELETE FROM public.user_roles 
WHERE user_id = 'b54232fe-f396-4a99-9d36-e1069e85e0c0' 
AND role = 'user';