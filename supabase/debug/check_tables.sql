-- Script to check database tables and permissions
-- Run this in your Supabase SQL Editor to help debug issues

-- Check artworks table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'artworks'
ORDER BY 
  ordinal_position;

-- Check artwork_images table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'artwork_images'
ORDER BY 
  ordinal_position;

-- Check RLS policies on artworks table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'artworks';

-- Check RLS policies on artwork_images table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'artwork_images';

-- Check if RLS is enabled on these tables
SELECT
  relname,
  relrowsecurity
FROM
  pg_class
WHERE
  relname IN ('artworks', 'artwork_images');

-- TEST INSERT PERMISSIONS:
-- This will check if the current user can insert a record (will be rolled back)
DO $$
BEGIN
  BEGIN
    INSERT INTO artworks (
      user_id, 
      title, 
      category, 
      status, 
      created_at, 
      updated_at
    ) 
    VALUES (
      auth.uid(), 
      'TEST - DO NOT SAVE', 
      'other', 
      'draft', 
      NOW(), 
      NOW()
    ) RETURNING id;
    
    RAISE NOTICE 'Insert into artworks works!';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting into artworks: %', SQLERRM;
    ROLLBACK;
  END;
END $$;

-- Check for database functions related to artwork insertion
SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM
  information_schema.routines
WHERE
  routine_name LIKE '%artwork%'
  AND routine_type = 'FUNCTION'
ORDER BY
  routine_name; 