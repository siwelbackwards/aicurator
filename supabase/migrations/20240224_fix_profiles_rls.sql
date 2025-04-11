-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Allow authenticated users to insert their own profiles
CREATE POLICY "Allow users to insert their own profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profiles
CREATE POLICY "Allow users to update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow public read access to profiles
CREATE POLICY "Allow public read access to profiles"
ON public.profiles
FOR SELECT
TO public
USING (true); 