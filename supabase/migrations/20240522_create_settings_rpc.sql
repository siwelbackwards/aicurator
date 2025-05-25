-- Create a function to upsert user settings
CREATE OR REPLACE FUNCTION upsert_user_settings(
  p_user_id UUID,
  p_notifications JSONB,
  p_updated_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
BEGIN
  -- Check if the user_settings table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_settings'
  ) THEN
    -- First try to update if record exists
    UPDATE user_settings
    SET 
      notifications = p_notifications,
      updated_at = p_updated_at
    WHERE user_id = p_user_id;
    
    -- If no rows were updated, insert a new record
    IF NOT FOUND THEN
      INSERT INTO user_settings (
        user_id, 
        notifications, 
        created_at, 
        updated_at
      ) VALUES (
        p_user_id, 
        p_notifications, 
        p_updated_at, 
        p_updated_at
      );
    END IF;
  ELSE
    -- If the table doesn't exist, do nothing
    RAISE NOTICE 'user_settings table does not exist';
  END IF;
END;
$$ LANGUAGE plpgsql; 