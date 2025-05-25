-- Create a user_preferences table for additional buyer preferences
-- This table will store preferences that aren't in the core profiles table

-- First check if the user_preferences table already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'user_preferences'
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
        USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

        RAISE NOTICE 'Created user_preferences table with RLS policies';
    ELSE
        RAISE NOTICE 'user_preferences table already exists';
    END IF;
END $$; 