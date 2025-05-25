-- Update profiles table schema to use full_address instead of address

-- First check if the address column exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'address'
    ) INTO column_exists;

    IF column_exists THEN
        -- If address column exists, add full_address and copy data
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'full_address'
        ) THEN
            -- Add the full_address column
            ALTER TABLE profiles ADD COLUMN full_address TEXT;
            
            -- Copy data from address to full_address
            UPDATE profiles SET full_address = address WHERE address IS NOT NULL;
            
            -- Inform about the change
            RAISE NOTICE 'Added full_address column and copied data from address column';
        ELSE
            RAISE NOTICE 'Both address and full_address columns exist';
        END IF;
    ELSE
        -- If address column doesn't exist, just add full_address if needed
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'full_address'
        ) THEN
            -- Add the full_address column
            ALTER TABLE profiles ADD COLUMN full_address TEXT;
            RAISE NOTICE 'Added full_address column (address column did not exist)';
        ELSE
            RAISE NOTICE 'full_address column already exists';
        END IF;
    END IF;
END $$;

-- Update any triggers that might rely on the address column

-- Verify the schema change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('address', 'full_address');

-- Instructions for manual execution:
-- Run this script in the Supabase SQL Editor to update the profiles table schema
-- This ensures compatibility with the updated onboarding forms 