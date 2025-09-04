-- Add user_status column to profiles table
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Add the user_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_status TEXT DEFAULT 'pending';
        
        -- Add check constraint for valid status values
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_status_check 
        CHECK (user_status IN ('pending', 'approved', 'rejected', 'suspended'));
        
        RAISE NOTICE 'Added user_status column to profiles table';
    ELSE
        RAISE NOTICE 'user_status column already exists';
    END IF;
END $$;

-- Step 2: Add other missing columns
DO $$
BEGIN
    -- status_changed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'status_changed_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status_changed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added status_changed_at column';
    END IF;
    
    -- status_changed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'status_changed_by'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status_changed_by UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added status_changed_by column';
    END IF;
    
    -- admin_notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column';
    END IF;
    
    -- rejection_reason
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column';
    END IF;
END $$;

-- Step 3: Set existing admin users to approved
UPDATE public.profiles 
SET 
    user_status = 'approved',
    status_changed_at = NOW()
WHERE role = 'admin' AND (user_status IS NULL OR user_status != 'approved');

-- Step 4: Set default status for existing users who don't have one
UPDATE public.profiles 
SET user_status = 'pending'
WHERE user_status IS NULL AND role != 'admin';

-- Step 5: Verify the changes
SELECT 
    'VERIFICATION:' as check,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN user_status = 'approved' THEN 1 END) as approved_users,
    COUNT(CASE WHEN user_status = 'pending' THEN 1 END) as pending_users
FROM public.profiles;

-- Step 6: Show your specific account
SELECT 
    'YOUR ACCOUNT:' as check,
    email,
    role,
    user_status,
    status_changed_at
FROM public.profiles 
WHERE email = 'lewis@tinydot.ai';
