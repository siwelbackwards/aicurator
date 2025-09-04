-- Verify the user approval system is properly set up

-- 1. Check if new columns exist in profiles table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('user_status', 'status_changed_at', 'status_changed_by', 'admin_notes', 'rejection_reason')
ORDER BY column_name;

-- 2. Check if pending_users view exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'pending_users'
);

-- 3. Check if update_user_status function exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'update_user_status'
);

-- 4. Check current admin users and their statuses
SELECT
    id,
    email,
    role,
    user_status,
    onboarding_completed,
    created_at
FROM public.profiles
WHERE role = 'admin';

-- 5. Check count of pending users
SELECT
    COUNT(*) as pending_users_count,
    COUNT(CASE WHEN has_photo_id THEN 1 END) as with_photo_id,
    COUNT(CASE WHEN has_address_proof THEN 1 END) as with_address_proof,
    COUNT(CASE WHEN verification_complete THEN 1 END) as fully_verified
FROM public.pending_users;

-- 6. Show recent pending users
SELECT
    email,
    full_name,
    created_at,
    has_photo_id,
    has_address_proof,
    verification_complete
FROM public.pending_users
ORDER BY created_at DESC
LIMIT 10;
