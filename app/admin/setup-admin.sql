-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create or update RLS policy to restrict access based on role
DROP POLICY IF EXISTS "Allow admins to update any profile" ON public.profiles;
CREATE POLICY "Allow admins to update any profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Make all approved artworks searchable
DROP POLICY IF EXISTS "Make approved artworks publicly viewable" ON public.artworks;
CREATE POLICY "Make approved artworks publicly viewable"
ON public.artworks
FOR SELECT
USING (status = 'approved');

-- Allow admins to update any artwork
DROP POLICY IF EXISTS "Allow admins to update any artwork" ON public.artworks;
CREATE POLICY "Allow admins to update any artwork"
ON public.artworks
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- To promote a user to admin, run the following SQL command:
/*
  1. Log into your Supabase instance dashboard
  2. Open the SQL Editor
  3. Replace 'user-email@example.com' with the actual email of the user you want to promote
  4. Run this command:
*/

-- UPDATE public.profiles 
-- SET role = 'admin' 
-- FROM auth.users
-- WHERE auth.users.email = 'user-email@example.com'
-- AND public.profiles.id = auth.users.id; 