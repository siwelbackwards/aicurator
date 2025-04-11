import { createClient } from '@supabase/supabase-js';

// Add TypeScript declaration for Window with ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      [key: string]: any;
    };
    // For Netlify's environment injection
    _env_?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      [key: string]: any;
    };
    netlifyEnv?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
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

// Debugging function to log all possible environment variable sources
function debugEnvironment() {
  if (typeof window === 'undefined') return;
  
  console.log('Environment debug:');
  console.log('- window.ENV:', window.ENV);
  console.log('- window._env_:', window._env_);
  console.log('- window.netlifyEnv:', window.netlifyEnv);
  console.log('- process.env.NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('- Netlify host detection:', window.location.hostname.includes('netlify.app'));
}

// Validate environment variables
function validateEnv() {
  // Debug environment before getting variables
  if (typeof window !== 'undefined') {
    debugEnvironment();
  }

  let supabaseUrl = '';
  let supabaseAnonKey = '';
  let supabaseServiceRoleKey = '';

  // Check all possible environment variable sources
  if (typeof window !== 'undefined') {
    // First try Netlify env variables (directly injected by plugin)
    if (window._env_ && window._env_.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Supabase credentials from Netlify _env_');
      supabaseUrl = window._env_.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window._env_.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabaseServiceRoleKey = window._env_.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    // Then try window.ENV (our custom storage)
    else if (window.ENV && window.ENV.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Supabase credentials from window.ENV');
      supabaseUrl = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabaseServiceRoleKey = window.ENV.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    // Then try Netlify runtime env
    else if (window.netlifyEnv && window.netlifyEnv.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Supabase credentials from netlifyEnv');
      supabaseUrl = window.netlifyEnv.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = window.netlifyEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabaseServiceRoleKey = window.netlifyEnv.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    // Then try process.env (standard Next.js environment)
    else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Supabase credentials from process.env');
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    // Fallback for Netlify deployments (known URL)
    else if (window.location.hostname.includes('netlify.app')) {
      console.log('Using fallback values for Netlify deployment');
      supabaseUrl = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
      supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw";
      supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
    }
    // Last fallback for localhost
    else if (window.location.hostname === 'localhost') {
      console.log('Using fallback Supabase credentials for localhost');
      supabaseUrl = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
      supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw";
      supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
    }
  } else {
    // Server-side rendering - use process.env
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Using Supabase credentials from process.env (server)');
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    }
  }

  console.log('Final Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'Not found');
  console.log('Final Anon Key:', supabaseAnonKey ? 'Found (hidden)' : 'Not found');
  console.log('Final Service Role Key:', supabaseServiceRoleKey ? 'Found (hidden)' : 'Not found');

  // Validate URL format
  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('Invalid SUPABASE_URL format:', supabaseUrl);
  }
  
  // Validate key format (without revealing full key)
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.error('Invalid SUPABASE_ANON_KEY format');
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

// Initialize Supabase client
const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = validateEnv();

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

// Regular client with anon key for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// Admin client with service role key for privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

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
  const { error } = await supabaseAdmin.storage.from('artwork-images').remove([filePath]);
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
    const serviceKeyStatus = supabaseServiceRoleKey ? 'Service role key found' : 'No service role key found';
    return { 
      url, 
      keyStatus, 
      serviceKeyStatus,
      connected: !!(supabaseUrl && supabaseAnonKey)
    };
  } catch (error) {
    return { url: 'Error', keyStatus: 'Error', serviceKeyStatus: 'Error', connected: false, error };
  }
}