-- ULTRA SIMPLE FIX - Just add the column and approve admins
-- Copy and paste this into Supabase SQL Editor

-- Add the missing column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'pending';

-- Approve all admin users
UPDATE public.profiles SET user_status = 'approved' WHERE role = 'admin';

-- Verify it worked
SELECT email, role, user_status FROM public.profiles WHERE role = 'admin';
