-- Clear RLS policy mess and implement simple permissive policies
-- to be executed in Supabase SQL Editor

-- First drop all existing policies
DROP POLICY IF EXISTS "Allow admins to update any artwork" ON public.artworks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.artworks;
DROP POLICY IF EXISTS "Allow authenticated users to insert artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow authenticated users to view all artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow public to view artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow users to delete their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow users to insert their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow users to update their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow users to view their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Anyone can view published artworks" ON public.artworks;
DROP POLICY IF EXISTS "Authenticated users can insert artworks" ON public.artworks;
DROP POLICY IF EXISTS "Make approved artworks publicly viewable" ON public.artworks;
DROP POLICY IF EXISTS "Users can create artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can insert their own artwork" ON public.artworks;
DROP POLICY IF EXISTS "Users can view approved artworks" ON public.artworks;

-- Create simple, readable policies

-- 1. Allow public to view published/approved artworks
CREATE POLICY "Public can view approved artworks"
ON public.artworks
FOR SELECT
TO public
USING (status IN ('approved', 'published'));

-- 2. Allow authenticated users to view all of their own artworks
CREATE POLICY "Users can view their own artworks"
ON public.artworks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Extremely permissive INSERT policy (fallback for troubleshooting)
CREATE POLICY "Authenticated users can create artworks"
ON public.artworks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Allow users to update their own artworks
CREATE POLICY "Users can update their own artworks"
ON public.artworks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Allow users to delete their own artworks
CREATE POLICY "Users can delete their own artworks"
ON public.artworks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'artworks';

-- List all policies on the artworks table
SELECT * FROM pg_policies WHERE tablename = 'artworks';

-- NOTE: Run this SQL in your Supabase SQL Editor at https://app.supabase.com
-- This approach prioritizes a working solution first, then you can tighten security later 