-- Apply User Approval System Migration
-- Copy and paste this entire script into your Supabase SQL Editor

-- Add user approval system to profiles table
DO $$
BEGIN
    -- Add user_status column with enum values
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_status'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN user_status TEXT DEFAULT 'pending'
        CHECK (user_status IN ('pending', 'approved', 'rejected', 'suspended'));
        RAISE NOTICE 'Added user_status column to profiles table';
    ELSE
        RAISE NOTICE 'user_status column already exists in profiles table';
    END IF;

    -- Add status_changed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status_changed_at'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN status_changed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added status_changed_at column to profiles table';
    ELSE
        RAISE NOTICE 'status_changed_at column already exists in profiles table';
    END IF;

    -- Add status_changed_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status_changed_by'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN status_changed_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added status_changed_by column to profiles table';
    ELSE
        RAISE NOTICE 'status_changed_by column already exists in profiles table';
    END IF;

    -- Add admin_notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column to profiles table';
    ELSE
        RAISE NOTICE 'admin_notes column already exists in profiles table';
    END IF;

    -- Add rejection_reason column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column to profiles table';
    ELSE
        RAISE NOTICE 'rejection_reason column already exists in profiles table';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_status ON public.profiles(user_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status_changed_at ON public.profiles(status_changed_at);

-- Create pending_users view
DROP VIEW IF EXISTS public.pending_users;
CREATE VIEW public.pending_users AS
SELECT
    p.*,
    CASE
        WHEN p.photo_id_url IS NOT NULL THEN true
        ELSE false
    END as has_photo_id,
    CASE
        WHEN p.proof_of_address_url IS NOT NULL THEN true
        ELSE false
    END as has_address_proof,
    CASE
        WHEN p.photo_id_url IS NOT NULL AND p.proof_of_address_url IS NOT NULL THEN true
        ELSE false
    END as verification_complete
FROM public.profiles p
WHERE p.user_status = 'pending';

-- Grant permissions
GRANT SELECT ON public.pending_users TO authenticated;

-- Create the update_user_status function
CREATE OR REPLACE FUNCTION public.update_user_status(
    user_id UUID,
    new_status TEXT,
    admin_id UUID,
    notes TEXT DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate status
    IF new_status NOT IN ('pending', 'approved', 'rejected', 'suspended') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status;
    END IF;

    -- Check if admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user status';
    END IF;

    -- Update the user status
    UPDATE public.profiles
    SET
        user_status = new_status,
        status_changed_at = NOW(),
        status_changed_by = admin_id,
        admin_notes = CASE
            WHEN notes IS NOT NULL THEN notes
            ELSE admin_notes
        END,
        rejection_reason = CASE
            WHEN new_status = 'rejected' THEN rejection_reason
            ELSE rejection_reason
        END
    WHERE id = user_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Create get_user_status function
CREATE OR REPLACE FUNCTION public.get_user_status(user_id UUID)
RETURNS TABLE (
    status TEXT,
    changed_at TIMESTAMPTZ,
    changed_by UUID,
    notes TEXT,
    rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Users can only check their own status
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Users can only check their own status';
    END IF;

    RETURN QUERY
    SELECT
        p.user_status,
        p.status_changed_at,
        p.status_changed_by,
        p.admin_notes,
        p.rejection_reason
    FROM public.profiles p
    WHERE p.id = user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_status(UUID) TO authenticated;

-- Update existing users to have approved status if they have completed onboarding
UPDATE public.profiles
SET user_status = 'approved',
    status_changed_at = COALESCE(updated_at, created_at, NOW())
WHERE user_status IS NULL
  AND onboarding_completed = true;

-- Update any remaining NULL statuses to 'pending' for safety
UPDATE public.profiles
SET user_status = 'pending',
    status_changed_at = COALESCE(updated_at, created_at, NOW())
WHERE user_status IS NULL;

-- Add RLS policies for admin functions
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;
CREATE POLICY "Admins can update user status"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Add admin view policy
DROP POLICY IF EXISTS "Admins can view pending users" ON public.pending_users;
CREATE POLICY "Admins can view pending users"
ON public.pending_users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- Verify the migration worked
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('user_status', 'status_changed_at', 'status_changed_by', 'admin_notes', 'rejection_reason')
ORDER BY column_name;
