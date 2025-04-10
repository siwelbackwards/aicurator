import { createClient } from '@supabase/supabase-js';

// Validate URL format
const isValidUrl = (urlString: string): boolean => {
  try {
    if (!urlString || urlString.includes('placeholder')) return false;
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

// Fixed values for aicurator.netlify.app
const AICURATOR_URL = 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
const AICURATOR_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw';

// Debugging function for environment variables
const debugEnv = () => {
  if (typeof window !== 'undefined') {
    console.log('Environment loading debug:');
    // Check window.env first (our custom object)
    console.log('- window.env exists:', Boolean((window as any).env));
    console.log('- NEXT_PUBLIC_SUPABASE_URL from window.env:', (window as any).env?.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
    // Then check window.ENV (from inject-env.js)
    console.log('- window.ENV exists:', Boolean((window as any).ENV));
    console.log('- NEXT_PUBLIC_SUPABASE_URL from window.ENV:', (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
    // Finally check process.env
    console.log('- process.env exists:', Boolean(process.env));
    console.log('- NEXT_PUBLIC_SUPABASE_URL from process.env:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
  }
};

// Validate environment variables
const validateEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables:');
    if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Missing required environment variables for Supabase');
  }

  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('Invalid Supabase URL:', supabaseUrl);
    throw new Error('Invalid Supabase URL');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Initialize Supabase client
const { supabaseUrl, supabaseAnonKey } = validateEnv();

// Log critical information for debugging
if (!supabaseUrl) {
  console.error('Missing Supabase URL - authentication will fail!');
  console.error('Please ensure environment variables are properly set.');
  if (typeof window !== 'undefined') {
    console.error('Current hostname:', window.location.hostname);
  }
}

if (!supabaseAnonKey) {
  console.error('Missing Supabase Anon Key - authentication will fail!');
}

// Create Supabase client with better error handling
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
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

// Test connection when client is initialized
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.error('Supabase connection test failed:', error);
      } else {
        console.log('Supabase connection test successful');
      }
    } catch (error) {
      console.error('Supabase connection test error:', error);
    }
  })();
}

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