-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars
-- Allow public read access to avatars
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatars
CREATE POLICY "Allow users to upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update/delete their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
); 