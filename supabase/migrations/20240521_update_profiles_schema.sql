-- Update profiles table schema with all potentially missing columns
DO $$
BEGIN
    -- Add date_of_birth column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to profiles table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in profiles table';
    END IF;

    -- Add address columns if they don't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'address_line1'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN address_line1 TEXT;
        RAISE NOTICE 'Added address_line1 column to profiles table';
    ELSE
        RAISE NOTICE 'address_line1 column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to profiles table';
    ELSE
        RAISE NOTICE 'city column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'country'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN country TEXT;
        RAISE NOTICE 'Added country column to profiles table';
    ELSE
        RAISE NOTICE 'country column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'postcode'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN postcode TEXT;
        RAISE NOTICE 'Added postcode column to profiles table';
    ELSE
        RAISE NOTICE 'postcode column already exists in profiles table';
    END IF;

    -- Add is_mobile column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_mobile'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_mobile BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_mobile column to profiles table';
    ELSE
        RAISE NOTICE 'is_mobile column already exists in profiles table';
    END IF;

    -- Ensure photo_id_url and proof_of_address_url columns exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'photo_id_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN photo_id_url TEXT;
        RAISE NOTICE 'Added photo_id_url column to profiles table';
    ELSE
        RAISE NOTICE 'photo_id_url column already exists in profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'proof_of_address_url'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN proof_of_address_url TEXT;
        RAISE NOTICE 'Added proof_of_address_url column to profiles table';
    ELSE
        RAISE NOTICE 'proof_of_address_url column already exists in profiles table';
    END IF;
END $$; 