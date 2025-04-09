import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Storage bucket name for artwork images
export const ARTWORK_IMAGES_BUCKET = 'artwork-images';

// Function to upload an image to Supabase Storage
export async function uploadArtworkImage(file: File, artworkId: string, isPrimary: boolean = false) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${artworkId}-${Date.now()}.${fileExt}`;
  const filePath = `${artworkId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(ARTWORK_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(ARTWORK_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  // Insert the image record into the artwork_images table
  const { error: insertError } = await supabase
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      file_path: filePath,
      is_primary: isPrimary,
      url: publicUrl
    });

  if (insertError) {
    throw insertError;
  }

  return {
    filePath,
    publicUrl
  };
}

// Function to delete an image from Supabase Storage
export async function deleteArtworkImage(filePath: string) {
  const { error } = await supabase.storage
    .from(ARTWORK_IMAGES_BUCKET)
    .remove([filePath]);

  if (error) {
    throw error;
  }
}