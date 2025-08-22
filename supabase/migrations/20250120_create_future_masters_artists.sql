-- Create future_masters_artists table for dynamic artist management
-- This table will store artist information for the Future Masters page

-- Create the future_masters_artists table
CREATE TABLE IF NOT EXISTS public.future_masters_artists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    exhibitions INTEGER DEFAULT 0,
    collections INTEGER DEFAULT 0,
    awards INTEGER DEFAULT 0,
    recent_work_1_url TEXT,
    recent_work_2_url TEXT,
    artist_name_for_search TEXT NOT NULL, -- Artist name to use for product search
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security)
ALTER TABLE public.future_masters_artists ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all records
CREATE POLICY "Admins can manage future masters artists" ON public.future_masters_artists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policy for public read access (only active artists)
CREATE POLICY "Public can view active future masters artists" ON public.future_masters_artists
    FOR SELECT USING (is_active = true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_future_masters_artists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_future_masters_artists_updated_at
    BEFORE UPDATE ON public.future_masters_artists
    FOR EACH ROW
    EXECUTE FUNCTION update_future_masters_artists_updated_at();

-- Insert sample data (the current hardcoded artists)
INSERT INTO public.future_masters_artists (
    name, location, specialty, description, image_url,
    exhibitions, collections, awards,
    recent_work_1_url, recent_work_2_url,
    artist_name_for_search, display_order
) VALUES
(
    'Elena Rossi',
    'Florence, Italy',
    'Contemporary Abstract',
    'Rising star in the contemporary art scene, known for her bold use of color and innovative techniques.',
    'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
    12, 8, 3,
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Elena%20Rossi3.jpg',
    'Elena Rossi',
    1
),
(
    'Yayoi Kusama',
    'Tokyo, Japan',
    'Contemporary Art',
    'Visionary artist known for her immersive installations and polka dot patterns that explore infinity and self-obliteration.',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/yayoi.webp',
    45, 30, 12,
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Yayoi%20Kusama2.jpg',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Yayoi%20Kusama3.webp',
    'Yayoi Kusama',
    2
),
(
    'Ai Weiwei',
    'Beijing, China',
    'Conceptual Art',
    'Provocative artist and activist whose work challenges political and social issues through various mediums.',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/ai%20weiwei.jpg',
    38, 25, 15,
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Ai%20Weiwei2.jpg',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Ai%20Weiwei3.jpeg',
    'Ai Weiwei',
    3
),
(
    'Olafur Eliasson',
    'Copenhagen, Denmark',
    'Installation Art',
    'Innovative artist creating immersive experiences that explore perception, movement, and environmental issues.',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/olafur.jpg',
    42, 28, 10,
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Olafur%20Eliasson2.webp',
    'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Olafur%20Eliasson3.jpg',
    'Olafur Eliasson',
    4
);

-- Add comments for documentation
COMMENT ON TABLE public.future_masters_artists IS 'Stores artist information for the Future Masters page, managed by admins';
COMMENT ON COLUMN public.future_masters_artists.artist_name_for_search IS 'The artist name to use when searching for their artworks in the search system';
