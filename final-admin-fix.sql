-- FINAL ADMIN FIX - Ensure everything is working
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Verify and fix your admin account
SELECT 'CURRENT STATUS:' as check, email, role, user_status
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Step 2: Force admin access
UPDATE public.profiles
SET
    role = 'admin',
    user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai';

-- Step 3: Verify the fix
SELECT 'AFTER FIX:' as check, email, role, user_status, updated_at
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Step 4: Check if the user_status column exists
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'user_status';

-- Step 5: Show all admin users
SELECT
    'ALL ADMINS:' as check,
    email,
    role,
    user_status
FROM public.profiles
WHERE role = 'admin';

-- If this still doesn't work, the issue might be:
-- 1. Browser cache - try Ctrl+F5 to hard refresh
-- 2. Session expired - try logging out and back in
-- 3. Check browser console for detailed error messages
