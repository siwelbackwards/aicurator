-- VERIFICATION SCRIPT - Run this AFTER the migration to check if it worked

-- Check if all required columns exist
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('user_status', 'status_changed_at', 'status_changed_by', 'admin_notes', 'rejection_reason');

-- Check if pending_users view exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'pending_users'
) as pending_users_view_exists;

-- Check if functions exist
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_user_status', 'get_user_status');

-- Check user status distribution
SELECT
    user_status,
    COUNT(*) as count
FROM public.profiles
GROUP BY user_status
ORDER BY user_status;

-- Check admin users specifically
SELECT
    id,
    email,
    role,
    user_status,
    status_changed_at
FROM public.profiles
WHERE role = 'admin';

-- Check pending users count
SELECT
    COUNT(*) as pending_users_count
FROM public.pending_users;

-- Test the view works
SELECT
    email,
    created_at,
    has_photo_id,
    has_address_proof
FROM public.pending_users
LIMIT 5;
