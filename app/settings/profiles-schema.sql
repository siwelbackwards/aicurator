-- Schema for profiles table
-- If the table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create policy to allow public read access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read all profiles
CREATE POLICY "Allow public read access to profiles"
ON public.profiles FOR SELECT USING (true);

-- Policy for users to update their own profiles
CREATE POLICY "Allow users to update their own profiles"
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Ensure the columns exist (add them if they don't)
DO $$ 
BEGIN
  -- Check if full_name column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
  END IF;

  -- Check if avatar_url column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;

  -- Check if updated_at column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
END $$;