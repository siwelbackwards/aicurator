-- DEBUG ADMIN ACCESS - Check what's happening with your admin account
-- Copy and paste this into Supabase SQL Editor

-- Check your specific admin account
SELECT
    id,
    email,
    role,
    user_status,
    onboarding_completed,
    created_at,
    updated_at
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Check all admin accounts
SELECT
    id,
    email,
    role,
    user_status
FROM public.profiles
WHERE role = 'admin';

-- Check if user_status column exists
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'user_status';

-- Check user count by status
SELECT
    user_status,
    COUNT(*) as count
FROM public.profiles
GROUP BY user_status;

-- Try to force approve your account specifically
UPDATE public.profiles
SET user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai' AND role = 'admin';

-- Verify the update worked
SELECT
    email,
    role,
    user_status,
    updated_at
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';
