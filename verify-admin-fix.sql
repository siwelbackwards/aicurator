-- VERIFY ADMIN FIX - Test that admin access is working
-- Copy and paste this into Supabase SQL Editor and run it

-- Test 1: Check your admin status
SELECT
    'ADMIN STATUS CHECK:' as test,
    email,
    role,
    user_status,
    CASE
        WHEN role = 'admin' THEN '✅ SHOULD HAVE ADMIN ACCESS'
        ELSE '❌ NOT AN ADMIN'
    END as access_check
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Test 2: Check all admin accounts
SELECT
    'ALL ADMINS:' as test,
    email,
    role,
    user_status
FROM public.profiles
WHERE role = 'admin';

-- Test 3: Simulate the admin check query that the app uses
SELECT
    'APP QUERY SIMULATION:' as test,
    role,
    user_status,
    CASE
        WHEN role = 'admin' THEN '✅ APP SHOULD GRANT ACCESS'
        WHEN user_status = 'approved' THEN '✅ APP SHOULD GRANT ACCESS'
        ELSE '❌ APP SHOULD DENY ACCESS'
    END as app_would_do
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Test 4: Check if pending_users view exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'pending_users'
) as pending_users_view_exists;

-- Test 5: Count pending users
SELECT
    'PENDING USERS COUNT:' as test,
    COUNT(*) as pending_count
FROM public.pending_users;
