-- Script to ensure all admin users are approved
-- Run this in your Supabase SQL editor or via CLI

-- First, check current admin statuses
SELECT
    id,
    email,
    role,
    user_status,
    onboarding_completed
FROM public.profiles
WHERE role = 'admin';

-- Update any admin users that are not approved
UPDATE public.profiles
SET
    user_status = 'approved',
    status_changed_at = COALESCE(status_changed_at, NOW()),
    status_changed_by = id,  -- Self-approval
    admin_notes = COALESCE(admin_notes, 'Auto-approved for admin role')
WHERE role = 'admin'
  AND (user_status IS NULL OR user_status != 'approved');

-- Verify all admins are now approved
SELECT
    id,
    email,
    role,
    user_status,
    status_changed_at
FROM public.profiles
WHERE role = 'admin';

-- Show summary
SELECT
    'Total admins: ' || COUNT(*) as summary
FROM public.profiles
WHERE role = 'admin'
UNION ALL
SELECT
    'Approved admins: ' || COUNT(*) as summary
FROM public.profiles
WHERE role = 'admin' AND user_status = 'approved'
UNION ALL
SELECT
    'Pending admins: ' || COUNT(*) as summary
FROM public.profiles
WHERE role = 'admin' AND user_status = 'pending';
