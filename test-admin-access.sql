-- TEST ADMIN ACCESS - Run this to verify admin setup is working
-- Copy and paste this into Supabase SQL Editor

-- Check if your admin account is properly configured
SELECT
    'Your Admin Status:' as info,
    email,
    role,
    user_status,
    CASE
        WHEN role = 'admin' AND user_status = 'approved' THEN '✅ ACCESS GRANTED'
        WHEN role = 'admin' AND user_status != 'approved' THEN '❌ ACCESS DENIED - wrong status'
        WHEN role != 'admin' THEN '❌ ACCESS DENIED - not admin'
        ELSE '❌ ACCESS DENIED - unknown error'
    END as access_status
FROM public.profiles
WHERE email = 'lewis@tinydot.ai';

-- Force approve if not already approved
UPDATE public.profiles
SET user_status = 'approved',
    updated_at = NOW()
WHERE email = 'lewis@tinydot.ai' AND role = 'admin';

-- Final verification
SELECT
    'FINAL CHECK:' as info,
    email,
    role,
    user_status,
    '✅ READY FOR ADMIN ACCESS' as status
FROM public.profiles
WHERE email = 'lewis@tinydot.ai' AND role = 'admin' AND user_status = 'approved';

-- Check if any other admins exist
SELECT
    'Other Admins:' as info,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'admin' AND email != 'lewis@tinydot.ai';
