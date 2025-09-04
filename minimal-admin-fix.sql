-- MINIMAL ADMIN FIX - Copy and paste this into Supabase SQL Editor
-- This will fix the admin access issue with minimal steps

-- Step 1: Add the user_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added user_status column';
    END IF;
END $$;

-- Step 2: Approve ALL admin users
UPDATE public.profiles
SET user_status = 'approved'
WHERE role = 'admin' AND (user_status IS NULL OR user_status != 'approved');

-- Step 3: Verify admin approval
SELECT
    'Admin users approved:' as status,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'admin' AND user_status = 'approved';

-- Step 4: Show your admin status
SELECT
    id,
    email,
    role,
    user_status
FROM public.profiles
WHERE role = 'admin';
