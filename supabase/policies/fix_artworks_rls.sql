-- EMERGENCY FIX FOR ARTWORKS TABLE RLS
-- THIS IS A TEMPORARY FIX - REPLACE WITH MORE RESTRICTIVE POLICIES ONCE WORKING

-- Enable Row Level Security on the artworks table
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for the artworks table to start fresh
DROP POLICY IF EXISTS "Users can view their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can insert their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can delete their own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Users can view artworks" ON public.artworks;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.artworks;

-- TEMPORARY HIGHLY PERMISSIVE POLICY - REMOVE AFTER DEBUGGING
-- This will allow ANY authenticated user to do ANY operation
CREATE POLICY "Allow all for authenticated users" 
ON public.artworks 
FOR ALL
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Verify that Row Level Security is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'artworks';

-- List all policies on the artworks table
SELECT * FROM pg_policies WHERE tablename = 'artworks';

-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- VERY IMPORTANT: This is a temporary fix with loose security - only use for debugging! 