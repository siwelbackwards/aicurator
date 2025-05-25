-- COMPREHENSIVE SCHEMA FIX FOR PROFILES AND PREFERENCES
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add all missing columns to the profiles table
DO $$
BEGIN
    -- Add date_of_birth column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column';
    END IF;

    -- Add phone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column';
    END IF;

    -- Add is_mobile column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_mobile'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_mobile BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_mobile column';
    END IF;

    -- Add address columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address_line1'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address_line1 TEXT;
        RAISE NOTICE 'Added address_line1 column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'country'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN country TEXT;
        RAISE NOTICE 'Added country column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'postcode'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN postcode TEXT;
        RAISE NOTICE 'Added postcode column';
    END IF;

    -- Add document verification columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'photo_id_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN photo_id_url TEXT;
        RAISE NOTICE 'Added photo_id_url column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'proof_of_address_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN proof_of_address_url TEXT;
        RAISE NOTICE 'Added proof_of_address_url column';
    END IF;

    -- Add onboarding_completed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added onboarding_completed column';
    END IF;

    -- Add interested_categories column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interested_categories'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN interested_categories TEXT[];
        RAISE NOTICE 'Added interested_categories column';
    END IF;
END $$;

-- 2. Create user_preferences table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_preferences'
    ) THEN
        -- Create the user_preferences table
        CREATE TABLE public.user_preferences (
            user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
            previously_transacted BOOLEAN DEFAULT FALSE,
            communication_preference BOOLEAN DEFAULT TRUE,
            collection_description TEXT,
            wishlist TEXT,
            collection_interests TEXT,
            budget_range TEXT,
            experience_level TEXT,
            preferred_art_periods TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Add comment to the table
        COMMENT ON TABLE public.user_preferences IS 'Stores additional user preferences that aren''t in the core profiles table';

        -- Enable RLS
        ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

        -- Add RLS policies
        CREATE POLICY "Users can view their own preferences" 
        ON public.user_preferences FOR SELECT 
        TO authenticated 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own preferences" 
        ON public.user_preferences FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own preferences" 
        ON public.user_preferences FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Admin can view all preferences" 
        ON public.user_preferences FOR SELECT 
        TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

        RAISE NOTICE 'Created user_preferences table with RLS policies';
    ELSE
        RAISE NOTICE 'user_preferences table already exists';
    END IF;
END $$;

-- 3. Set up storage permissions for verifications folder
DO $$
BEGIN
    -- Check if artwork-images bucket exists and create RLS policies
    IF EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'artwork-images'
    ) THEN
        -- Create policy for uploading to verifications folder
        BEGIN
            CREATE POLICY "Allow uploads to verifications folder" 
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
        
        -- Create policy for reading from verifications folder
        BEGIN
            CREATE POLICY "Allow users to read their own verification documents" 
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
        
        -- Create policy for admins to read all verification documents
        BEGIN
            CREATE POLICY "Allow admins to read all verification documents" 
            ON storage.objects FOR SELECT 
            TO authenticated 
            USING (
                bucket_id = 'artwork-images' AND 
                (storage.foldername(name))[1] = 'verifications' AND
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );
            RAISE NOTICE 'Created admin read policy for verifications folder';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Admin read policy for verifications folder already exists';
        END;
    ELSE
        RAISE NOTICE 'artwork-images bucket does not exist. Please create it first.';
    END IF;
END $$;

-- 4. Check if schema changes were applied successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- Also check user_preferences table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_preferences'
) AS user_preferences_table_exists; 