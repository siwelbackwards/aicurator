import { createClient } from '@supabase/supabase-js';

// Debugging function for environment variables
const debugEnv = () => {
  if (typeof window !== 'undefined') {
    console.log('Environment loading debug:');
    console.log('- window.env exists:', Boolean((window as any).env));
    console.log('- NEXT_PUBLIC_SUPABASE_URL from window:', (window as any).env?.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
    console.log('- process.env exists:', Boolean(process.env));
    console.log('- NEXT_PUBLIC_SUPABASE_URL from process.env:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
  }
};

// Try to get environment variables
const getEnvVars = () => {
  // For debugging only
  debugEnv();
  
  // First look for runtime environment variables that might be injected by env.js
  // This is especially important for static site deployments
  let supabaseUrl = typeof window !== 'undefined' && (window as any).env?.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = typeof window !== 'undefined' && (window as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fall back to Next.js environment variables
  if (!supabaseUrl) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (!supabaseAnonKey) {
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  // Use Netlify-specific environment detection as a last resort
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    // If on Netlify, try to load from common endpoints where env vars might be injected
    const netlifyEnv = (window as any)._env || (window as any).ENV || {};
    supabaseUrl = supabaseUrl || netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = supabaseAnonKey || netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Get environment variables
const { supabaseUrl, supabaseAnonKey } = getEnvVars();

// Log critical information for debugging
if (!supabaseUrl) {
  console.error('Missing Supabase URL - authentication will fail!');
}

if (!supabaseAnonKey) {
  console.error('Missing Supabase Anon Key - authentication will fail!');
}

export const supabase = createClient(
  supabaseUrl || '', // Provide empty string as fallback
  supabaseAnonKey || '', // Provide empty string as fallback
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Add error handling and logging
      fetch: (...args) => {
        return fetch(...args).catch(error => {
          console.error('Supabase fetch error:', error);
          throw error;
        });
      }
    }
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
        upsert: true
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