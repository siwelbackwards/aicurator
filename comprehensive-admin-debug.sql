-- COMPREHENSIVE ADMIN DEBUG - Find and fix the admin access issue
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Check your specific user in auth.users table
SELECT
    'Auth User Check:' as step,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'lewis@tinydot.ai';

-- Step 2: Check your profile
SELECT
    'Profile Check:' as step,
    p.id,
    p.email,
    p.role,
    p.user_status,
    p.onboarding_completed,
    CASE
        WHEN p.role = 'admin' AND p.user_status = 'approved' THEN '✅ SHOULD HAVE ACCESS'
        WHEN p.role = 'admin' AND p.user_status != 'approved' THEN '❌ MISSING APPROVED STATUS'
        WHEN p.role != 'admin' THEN '❌ NOT AN ADMIN'
        ELSE '❌ UNKNOWN ISSUE'
    END as diagnosis
FROM public.profiles p
WHERE p.email = 'lewis@tinydot.ai';

-- Step 3: Force fix any issues
UPDATE public.profiles
SET
    role = 'admin',
    user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai';

-- Step 4: Verify the fix
SELECT
    'AFTER FIX:' as step,
    p.id,
    p.email,
    p.role,
    p.user_status,
    '✅ ADMIN ACCESS SHOULD WORK NOW' as status
FROM public.profiles p
WHERE p.email = 'lewis@tinydot.ai';

-- Step 5: Check for any other potential issues
SELECT
    'System Check:' as step,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN user_status = 'approved' THEN 1 END) as approved_users
FROM public.profiles;

-- Step 6: Test the admin query that the app uses
SELECT
    'App Query Test:' as step,
    role,
    user_status
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';
