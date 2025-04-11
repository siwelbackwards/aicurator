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

// Debug function to check key values
function debugKeys() {
  // Get URL and key
  let url = '';
  let key = '';
  
  // Browser environment
  if (typeof window !== 'undefined') {
    // First try window.ENV (from env.js)
    if (window.ENV?.NEXT_PUBLIC_SUPABASE_URL) {
      url = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      key = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      console.log('Keys from window.ENV');
    } 
    // Then try process.env
    else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      console.log('Keys from process.env');
    }
  } 
  // Server environment
  else {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    console.log('Keys from server process.env');
  }
  
  // Debug output - show partial key for verification
  console.log('Supabase URL:', url);
  if (key) {
    // Only show first 10 chars, then hide the rest
    console.log('Anon Key (partial):', key.substring(0, 10) + '...[hidden]');
    console.log('Key length:', key.length);
  } else {
    console.log('Anon Key: Missing');
  }
  
  return { url, key };
}

// Validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Validate key format
function isValidKey(key: string): boolean {
  // JWT tokens typically follow pattern: xxxxx.yyyyy.zzzzz
  return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
}

// Initialize Supabase client with built-in fallbacks
function initSupabaseClient() {
  // Debug current keys
  const { url, key } = debugKeys();
  
  // Final URL and key to use
  let supabaseUrl = url;
  let supabaseAnonKey = key;
  
  // Fallback values if needed
  if (!isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
    console.log('Using hardcoded fallback values');
    supabaseUrl = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.7QCxICVm1H7OmW_6OJ16-7YfyR6cYCfmb5qiCcUUYQw";
  }
  
  // Create client with the final URL and key
  console.log('Creating Supabase client with:');
  console.log('- URL:', supabaseUrl);
  console.log('- Key valid:', isValidKey(supabaseAnonKey));
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      }
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

// Initialize admin client with service role key
function initAdminClient() {
  // Get URL 
  const { url } = debugKeys();
  let supabaseUrl = url;
  let serviceRoleKey = '';
  
  // Get service role key
  if (typeof window !== 'undefined' && window.ENV?.SUPABASE_SERVICE_ROLE_KEY) {
    serviceRoleKey = window.ENV.SUPABASE_SERVICE_ROLE_KEY;
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  
  // Fallback values if needed
  if (!isValidUrl(supabaseUrl) || !isValidKey(serviceRoleKey)) {
    console.log('Using hardcoded fallback values for admin client');
    supabaseUrl = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
    serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
  }
  
  try {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } catch (error) {
    console.error('Error creating admin Supabase client:', error);
    throw error;
  }
}

// Export Supabase clients
export const supabase = initSupabaseClient();
export const supabaseAdmin = initAdminClient();

// Connection test function to check configuration
export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
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

// Artwork image functions
export async function deleteArtworkImage(filePath: string) {
  const { error } = await supabaseAdmin.storage.from('artwork-images').remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Test function to check whether the client can connect to the database
export function getConnectionStatus() {
  const { url, key } = debugKeys();
  return {
    url: url || 'No URL found',
    keyStatus: isValidKey(key) ? 'Valid key found' : 'Invalid or missing key',
    connected: !!(url && isValidKey(key))
  };
}