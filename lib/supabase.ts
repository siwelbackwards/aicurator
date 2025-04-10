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

// Try to get environment variables
const getEnvVars = () => {
  // For debugging only
  debugEnv();
  
  let supabaseUrl = '';
  let supabaseAnonKey = '';

  if (typeof window !== 'undefined') {
    // Priority 1: Check window.ENV (from inject-env.js script) - Netlify injects variables here
    if ((window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Netlify injected variables from window.ENV');
      supabaseUrl = (window as any).ENV.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = (window as any).ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
    // Priority 2: Check window.env (from our env.js)
    else if ((window as any).env?.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using variables from window.env');
      supabaseUrl = (window as any).env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = (window as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    } 
    // Priority 3: Check if there are Netlify-specific environment variables in _env
    else if (window.location.hostname.includes('netlify.app')) {
      const netlifyEnv = (window as any)._env || {};
      supabaseUrl = netlifyEnv.NEXT_PUBLIC_SUPABASE_URL || '';
      supabaseAnonKey = netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      console.log('Using Netlify _env variables');
    }
  }

  // Priority 4: Fall back to Next.js environment variables
  if (!isValidUrl(supabaseUrl) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('Using Next.js process.env variables');
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  // Log values (partially) for debugging
  if (supabaseUrl) {
    console.log(`Found Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
  }
  if (supabaseAnonKey) {
    console.log(`Found Supabase Anon Key: ${supabaseAnonKey.substring(0, 15)}...`);
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Get environment variables
const { supabaseUrl, supabaseAnonKey } = getEnvVars();

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