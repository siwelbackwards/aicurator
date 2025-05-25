-- Set up storage structure for verification documents
-- This script creates the necessary folders in the artwork-images bucket

-- Check if 'artwork-images' bucket exists
SELECT 1 FROM storage.buckets WHERE name = 'artwork-images';

-- Create a function to setup storage policy for the verifications folder
CREATE OR REPLACE FUNCTION setup_verification_storage()
RETURNS VOID AS $$
BEGIN
    -- Check if the artwork-images bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'artwork-images') THEN
        -- Create RLS policy to allow authenticated users to upload to their own verification folder
        BEGIN
            CREATE POLICY "Users can upload to their own verifications folder" 
            ON storage.objects FOR INSERT 
            TO authenticated 
            WITH CHECK (
                bucket_id = 'artwork-images' AND 
                (storage.foldername(name))[1] = 'verifications' AND
                (storage.foldername(name))[2] = auth.uid()::text
            );
            
            RAISE NOTICE 'Created upload policy for verifications folder';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Upload policy for verifications folder already exists';
        END;
        
        -- Create RLS policy to allow authenticated users to read their own verification documents
        BEGIN
            CREATE POLICY "Users can read their own verification documents" 
            ON storage.objects FOR SELECT 
            TO authenticated 
            USING (
                bucket_id = 'artwork-images' AND 
                (storage.foldername(name))[1] = 'verifications' AND 
                (storage.foldername(name))[2] = auth.uid()::text
            );
            
            RAISE NOTICE 'Created read policy for verifications folder';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Read policy for verifications folder already exists';
        END;
        
        -- Create RLS policy to allow admins to read all verification documents
        BEGIN
            CREATE POLICY "Admins can read all verification documents" 
            ON storage.objects FOR SELECT 
            TO authenticated 
            USING (
                bucket_id = 'artwork-images' AND 
                (storage.foldername(name))[1] = 'verifications' AND
                auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
            );
            
            RAISE NOTICE 'Created admin read policy for verifications folder';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Admin read policy for verifications folder already exists';
        END;
        
        RAISE NOTICE 'Verification storage setup complete for artwork-images bucket';
    ELSE
        RAISE EXCEPTION 'artwork-images bucket does not exist! Please create it first.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the setup function
SELECT setup_verification_storage();

-- Clean up (drop the function as it's only needed once)
DROP FUNCTION IF EXISTS setup_verification_storage(); 