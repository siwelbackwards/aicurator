-- Backfill user_settings for existing users
-- This script will create user_settings records for any profiles that don't already have them

-- First, let's check which users don't have settings
WITH missing_settings AS (
  SELECT p.id 
  FROM profiles p
  LEFT JOIN user_settings us ON p.id = us.user_id
  WHERE us.user_id IS NULL
)
SELECT COUNT(*) AS users_without_settings FROM missing_settings;

-- Now create settings for all users that don't have them
INSERT INTO user_settings (user_id, notifications, created_at, updated_at)
SELECT 
  p.id, 
  '{"email": true, "updates": true, "marketing": false}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM 
  profiles p
LEFT JOIN 
  user_settings us ON p.id = us.user_id
WHERE 
  us.user_id IS NULL;

-- Verify all users now have settings
WITH missing_settings AS (
  SELECT p.id 
  FROM profiles p
  LEFT JOIN user_settings us ON p.id = us.user_id
  WHERE us.user_id IS NULL
)
SELECT COUNT(*) AS users_without_settings_after FROM missing_settings;

-- To run this script, execute it in the Supabase SQL Editor
-- This is a one-time operation to ensure all existing users have settings 