-- Verify user data integrity between profiles and user_settings
-- This script checks for any mismatches or data issues

-- 1. Check for profiles without user_settings
SELECT 
  p.id, 
  p.email, 
  p.user_type, 
  p.created_at,
  'Missing user_settings' AS issue
FROM 
  profiles p
LEFT JOIN 
  user_settings us ON p.id = us.user_id
WHERE 
  us.user_id IS NULL
ORDER BY 
  p.created_at DESC;

-- 2. Check for user_settings without profiles (orphaned records)
SELECT 
  us.user_id, 
  us.created_at,
  'Orphaned user_settings' AS issue
FROM 
  user_settings us
LEFT JOIN 
  profiles p ON us.user_id = p.id
WHERE 
  p.id IS NULL
ORDER BY 
  us.created_at DESC;

-- 3. Check for malformed notification JSON
SELECT 
  us.user_id,
  p.email,
  us.notifications,
  'Malformed notifications' AS issue
FROM 
  user_settings us
JOIN 
  profiles p ON us.user_id = p.id
WHERE 
  us.notifications IS NULL
  OR us.notifications::text = '{}'
  OR us.notifications::text NOT LIKE '%email%'
  OR us.notifications::text NOT LIKE '%updates%'
ORDER BY 
  p.created_at DESC;

-- 4. Check profiles with missing essential fields
SELECT 
  id,
  email,
  user_type,
  role,
  created_at,
  'Incomplete profile' AS issue
FROM 
  profiles
WHERE 
  user_type IS NULL 
  OR role IS NULL
  OR email IS NULL
ORDER BY 
  created_at DESC;

-- 5. Summary statistics
SELECT 
  COUNT(*) AS total_profiles,
  COUNT(DISTINCT email) AS unique_emails,
  SUM(CASE WHEN user_type = 'buyer' THEN 1 ELSE 0 END) AS buyer_count,
  SUM(CASE WHEN user_type = 'seller' THEN 1 ELSE 0 END) AS seller_count,
  SUM(CASE WHEN user_type IS NULL THEN 1 ELSE 0 END) AS unknown_type_count
FROM 
  profiles;

-- 6. Check notification preferences distribution
SELECT 
  JSONB_EXTRACT_PATH_TEXT(notifications, 'email')::boolean AS email_notifications,
  JSONB_EXTRACT_PATH_TEXT(notifications, 'updates')::boolean AS update_notifications,
  JSONB_EXTRACT_PATH_TEXT(notifications, 'marketing')::boolean AS marketing_notifications,
  COUNT(*) AS count
FROM 
  user_settings
GROUP BY 
  1, 2, 3
ORDER BY 
  COUNT(*) DESC;

-- To run this script, execute it in the Supabase SQL Editor
-- It will help identify any data integrity issues with users and their settings 