-- First, make sure the artwork-images bucket exists
INSERT INTO storage.buckets (id, name)
VALUES ('artwork-images', 'artwork-images')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for the public folder
CREATE POLICY "Allow uploads to public folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'artwork-images' AND
    (storage.foldername(name))[1] = 'public'
);

-- Allow anyone to view files in the public folder
CREATE POLICY "Allow anyone to view public folder"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'artwork-images' AND
    (storage.foldername(name))[1] = 'public'
);

-- Enable public access for artwork_images table
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to insert
CREATE POLICY "Allow authenticated users to insert artwork_images"
ON artwork_images
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view all artwork_images (for simplicity)
CREATE POLICY "Allow users to view all artwork_images"
ON artwork_images
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on artworks table
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to insert artworks
CREATE POLICY "Allow authenticated users to insert artworks"
ON artworks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view their own artworks
CREATE POLICY "Allow users to view their own artworks"
ON artworks
FOR SELECT
TO authenticated
USING (user_id = auth.uid()); 