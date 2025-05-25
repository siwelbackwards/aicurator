-- Add date_of_birth column to profiles table
DO $$
BEGIN
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
END $$; 