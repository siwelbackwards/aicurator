-- Schema for user_settings table
-- If the table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  notifications jsonb DEFAULT '{"email": true, "marketing": false, "updates": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own settings
CREATE POLICY "Allow users to read their own settings"
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own settings
CREATE POLICY "Allow users to insert their own settings"
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own settings
CREATE POLICY "Allow users to update their own settings"
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to create initial user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial user settings
  INSERT INTO public.user_settings (user_id, notifications)
  VALUES (NEW.id, '{"email": true, "marketing": false, "updates": true}'::jsonb);
  
  -- Create initial profile record
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 