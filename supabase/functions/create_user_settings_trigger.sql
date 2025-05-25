-- Create user settings trigger for new users
-- This function will ensure a user_settings record is created for each user

-- First create function to handle the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user_settings record already exists
  IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = NEW.id) THEN
    -- Insert a new record with default settings
    INSERT INTO public.user_settings (
      user_id, 
      notifications, 
      created_at, 
      updated_at
    ) VALUES (
      NEW.id, 
      '{"email": true, "updates": true, "marketing": false}', 
      CURRENT_TIMESTAMP, 
      CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Created new user_settings record for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS create_user_settings_trigger ON public.profiles;

CREATE TRIGGER create_user_settings_trigger
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_settings();

-- Add comment explaining the purpose
COMMENT ON FUNCTION public.handle_new_user_settings() IS 
  'Ensures that a user_settings record is created for each user in the profiles table';

-- To run this script, execute it in the Supabase SQL Editor
-- This will ensure that every new user has default notification settings 