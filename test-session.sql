-- TEST SESSION AND ADMIN ACCESS
-- Copy and paste this into Supabase SQL Editor

-- Check if your user exists in auth.users
SELECT
    'AUTH USER CHECK:' as test,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'lewis@tinydot.ai';

-- Check your profile
SELECT
    'PROFILE CHECK:' as test,
    p.id,
    p.email,
    p.role,
    p.user_status,
    CASE
        WHEN p.role = 'admin' THEN '✅ SHOULD HAVE ADMIN ACCESS'
        WHEN p.role = 'admin' AND p.user_status = 'approved' THEN '✅ SHOULD HAVE ADMIN ACCESS'
        ELSE '❌ ACCESS ISSUE'
    END as status
FROM public.profiles p
WHERE p.email = 'lewis@tinydot.ai';

-- Force ensure admin access
UPDATE public.profiles
SET
    role = 'admin',
    user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai';

-- Final verification
SELECT
    'FINAL VERIFICATION:' as test,
    email,
    role,
    user_status,
    '✅ ADMIN ACCESS CONFIRMED' as result
FROM public.profiles
WHERE email = 'lewis@tinydot.ai' AND role = 'admin' AND user_status = 'approved';

-- Check for any session issues
SELECT
    'SYSTEM STATUS:' as test,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN user_status = 'approved' THEN 1 END) as approved_users
FROM public.profiles;
