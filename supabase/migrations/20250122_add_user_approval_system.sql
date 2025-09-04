-- Add user approval system to profiles table
-- This migration adds columns to track user approval status

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

    -- Add approval/rejection metadata columns
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

    -- Add rejection_reason for more specific rejection feedback
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

    -- Create index on user_status for performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_user_status'
    ) THEN
        CREATE INDEX idx_profiles_user_status ON public.profiles(user_status);
        RAISE NOTICE 'Created index on user_status column';
    END IF;

    -- Create index on status_changed_at for sorting
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_status_changed_at'
    ) THEN
        CREATE INDEX idx_profiles_status_changed_at ON public.profiles(status_changed_at);
        RAISE NOTICE 'Created index on status_changed_at column';
    END IF;

END $$;

-- Update existing users to have 'approved' status if they have completed onboarding
-- This preserves existing user access
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

-- Update RLS policies to include user_status checks
-- Note: This assumes existing RLS is already set up for profiles table

-- Add policy for admins to update user status
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

-- Add policy for users to read their own status
DROP POLICY IF EXISTS "Users can read their own status" ON public.profiles;
CREATE POLICY "Users can read their own status"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a view for pending users (admin only)
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

-- Grant access to the view for admins
GRANT SELECT ON public.pending_users TO authenticated;
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

-- Create a function to update user status with proper tracking
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

    -- Log the action (you might want to create an audit log table)
    -- INSERT INTO audit_logs (action, user_id, admin_id, details, created_at)
    -- VALUES ('status_change', user_id, admin_id,
    --         json_build_object('new_status', new_status, 'notes', notes), NOW());

    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users (the function checks for admin internally)
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- Create a function to get user status for client-side checks
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
