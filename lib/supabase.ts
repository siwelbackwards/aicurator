import { createClient } from '@supabase/supabase-js';

// Add TypeScript declaration for Window with ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      [key: string]: any;
    };
  }
}

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
function validateEnv() {
  let supabaseUrl = '';
  let supabaseAnonKey = '';

  // Check for variables in window.ENV (Netlify setup)
  if (typeof window !== 'undefined' && window.ENV) {
    console.log('Using Supabase credentials from window.ENV');
    supabaseUrl = window.ENV.NEXT_PUBLIC_SUPABASE_URL || '';
    supabaseAnonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Debug key (only showing first/last few chars for security)
    if (supabaseAnonKey) {
      const keyStart = supabaseAnonKey.substring(0, 10);
      const keyEnd = supabaseAnonKey.substring(supabaseAnonKey.length - 5);
      console.log(`Key found with format: ${keyStart}...${keyEnd}, length: ${supabaseAnonKey.length}`);
    } else {
      console.error('No key found in window.ENV');
    }
  } 
  // Check for variables in process.env (standard setup)
  else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Using Supabase credentials from process.env');
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  // Fallback values for development
  else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('Using hardcoded fallback Supabase credentials for localhost');
    supabaseUrl = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw";
  }

  // Validate URL format
  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('Invalid SUPABASE_URL format:', supabaseUrl);
  }
  
  // Validate key format (without revealing full key)
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.error('Invalid SUPABASE_ANON_KEY format - length too short');
  }

  // Validate JWT structure (should be JWT format with 3 parts separated by dots)
  if (supabaseAnonKey && !supabaseAnonKey.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
    console.error('Invalid JWT format for SUPABASE_ANON_KEY');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Initialize Supabase client
const { supabaseUrl, supabaseAnonKey } = validateEnv();

console.log('Creating Supabase client with:', { 
  url: supabaseUrl, 
  keyLength: supabaseAnonKey?.length
});

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
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Connection test function
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('artworks').select('count()', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}

// Test function to check whether the client can connect to the database
export function getConnectionStatus() {
  try {
    const url = supabaseUrl || 'No URL found';
    const keyStatus = supabaseAnonKey ? 'Key found' : 'No key found';
    return { url, keyStatus, connected: !!(supabaseUrl && supabaseAnonKey) };
  } catch (error) {
    return { url: 'Error', keyStatus: 'Error', connected: false, error };
  }
}