-- Fix admin user status - ensure all admins are approved
-- Run this in your Supabase SQL editor

-- First, check current admin statuses
SELECT
    id,
    email,
    role,
    user_status,
    created_at
FROM public.profiles
WHERE role = 'admin';

-- Update all admin users to approved status
UPDATE public.profiles
SET
    user_status = 'approved',
    status_changed_at = COALESCE(status_changed_at, NOW()),
    status_changed_by = id,
    admin_notes = COALESCE(admin_notes, 'Auto-approved for admin role')
WHERE role = 'admin'
  AND (user_status IS NULL OR user_status != 'approved');

-- Verify the updates
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
WHERE role = 'admin' AND user_status = 'approved';
