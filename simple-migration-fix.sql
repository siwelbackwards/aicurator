-- SIMPLE MIGRATION FIX - Run this FIRST in Supabase SQL Editor
-- Copy and paste the ENTIRE script below into your Supabase SQL Editor and run it

-- Step 1: Add the required columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'pending'
CHECK (user_status IN ('pending', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_status ON public.profiles(user_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status_changed_at ON public.profiles(status_changed_at);

-- Step 3: Update existing users (admins get approved, others get pending)
UPDATE public.profiles
SET user_status = 'approved',
    status_changed_at = COALESCE(updated_at, created_at, NOW())
WHERE role = 'admin';

UPDATE public.profiles
SET user_status = 'approved',
    status_changed_at = COALESCE(updated_at, created_at, NOW())
WHERE user_status IS NULL
  AND onboarding_completed = true
  AND role != 'admin';

UPDATE public.profiles
SET user_status = 'pending',
    status_changed_at = COALESCE(updated_at, created_at, NOW())
WHERE user_status IS NULL;

-- Step 4: Create the pending_users view
CREATE OR REPLACE VIEW public.pending_users AS
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

-- Step 5: Grant permissions
GRANT SELECT ON public.pending_users TO authenticated;

-- Step 6: Create helper functions
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
    IF new_status NOT IN ('pending', 'approved', 'rejected', 'suspended') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update user status';
    END IF;

    UPDATE public.profiles
    SET
        user_status = new_status,
        status_changed_at = NOW(),
        status_changed_by = admin_id,
        admin_notes = COALESCE(notes, admin_notes),
        rejection_reason = CASE
            WHEN new_status = 'rejected' THEN rejection_reason
            ELSE rejection_reason
        END
    WHERE id = user_id;

    RETURN TRUE;
END;
$$;

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

-- Step 7: Grant function permissions
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_status(UUID) TO authenticated;

-- Step 8: Add RLS policies
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

-- Step 9: Verification - Check results
SELECT
    'Migration completed successfully!' as status,
    COUNT(*) as total_users
FROM public.profiles;

SELECT
    user_status,
    COUNT(*) as count
FROM public.profiles
GROUP BY user_status;

SELECT
    'Admin users:' as info,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'admin';

SELECT
    'Approved admins:' as info,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'admin' AND user_status = 'approved';
