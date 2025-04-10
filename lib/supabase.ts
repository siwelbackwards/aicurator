import { createClient } from '@supabase/supabase-js';

// First look for runtime environment variables that might be injected by env.js
// This is especially important for static site deployments
let supabaseUrl = typeof window !== 'undefined' && (window as any).env?.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = typeof window !== 'undefined' && (window as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fall back to Next.js environment variables
if (!supabaseUrl) {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Missing Supabase URL');
  }
}

if (!supabaseAnonKey) {
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    console.error('Missing Supabase Anon Key');
  }
}

export const supabase = createClient(
  supabaseUrl || '', // Provide empty string as fallback
  supabaseAnonKey || '', // Provide empty string as fallback
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
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user?.id) throw new Error('No authenticated user found');

    const fileExt = file.name.split('.').pop();
    const fileName = `${artworkId}-${Date.now()}.${fileExt}`;
    // Include user ID in the path for RLS policies
    const filePath = `${session.user.id}/${artworkId}/${fileName}`;

    console.log('Uploading to path:', filePath);

    const { data, error } = await supabase.storage
      .from(ARTWORK_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
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
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    return {
      filePath,
      publicUrl
    };
  } catch (error) {
    console.error('Error in uploadArtworkImage:', error);
    throw error;
  }
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