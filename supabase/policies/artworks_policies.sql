-- Enable Row Level Security on the artworks table
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for the artworks table to start fresh
DROP POLICY IF EXISTS "Users can view their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can insert their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can delete their own artworks" ON public.artworks;

-- Create a policy that allows authenticated users to view artworks
CREATE POLICY "Users can view artworks" 
ON public.artworks
FOR SELECT
TO authenticated
USING (true);  -- This allows authenticated users to view all artworks

-- Create a policy that allows authenticated users to insert artworks
CREATE POLICY "Users can insert their own artworks" 
ON public.artworks 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows authenticated users to update their own artworks
CREATE POLICY "Users can update their own artworks"
ON public.artworks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows authenticated users to delete their own artworks
CREATE POLICY "Users can delete their own artworks"
ON public.artworks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- Instructions:
-- 1. Go to your Supabase dashboard (https://app.supabase.com)
-- 2. Navigate to "SQL Editor"
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute the SQL 