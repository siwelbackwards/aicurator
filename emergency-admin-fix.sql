-- EMERGENCY ADMIN FIX - If nothing else works, run this
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Check current state
SELECT 'BEFORE FIX:' as status, email, role, user_status
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Step 2: Force everything to be correct
UPDATE public.profiles
SET
    role = 'admin',
    user_status = 'approved',
    onboarding_completed = true,
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai';

-- Step 3: Verify the fix worked
SELECT 'AFTER FIX:' as status, email, role, user_status, onboarding_completed
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Step 4: Double-check all admin accounts
SELECT 'ALL ADMINS:' as status, email, role, user_status
FROM public.profiles
WHERE role = 'admin';

-- If you still have issues after this, the problem might be:
-- 1. Browser cache (try hard refresh: Ctrl+F5)
-- 2. Session issue (try logging out and back in)
-- 3. App cache (try clearing browser cache)
