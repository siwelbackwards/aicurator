-- QUICK ADMIN FIX - Make sure your admin account works
-- Copy and paste this into Supabase SQL Editor and run it

-- Check your current admin status
SELECT
    'Your Current Status:' as check,
    email,
    role,
    user_status,
    CASE
        WHEN role = 'admin' THEN '✅ SHOULD WORK'
        ELSE '❌ NOT AN ADMIN'
    END as expected_result
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Force approve your admin account
UPDATE public.profiles
SET
    role = 'admin',
    user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai';

-- Verify the fix worked
SELECT
    'AFTER FIX:' as check,
    email,
    role,
    user_status,
    '✅ ADMIN ACCESS SHOULD WORK NOW' as result
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Check all admin accounts
SELECT
    'ALL ADMINS:' as check,
    email,
    role,
    user_status
FROM public.profiles
WHERE role = 'admin';
