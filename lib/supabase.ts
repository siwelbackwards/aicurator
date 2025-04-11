import { createBrowserClient } from "@supabase/ssr";
import { createClient as createClientOriginal } from '@supabase/supabase-js';

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
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os";
  }
  
  // Create client with the final URL and key
  console.log('Creating Supabase client with:');
  console.log('- URL:', supabaseUrl);
  console.log('- Key valid:', isValidKey(supabaseAnonKey));
  
  try {
    // Use the new ssr client for browser
    if (typeof window !== 'undefined') {
      return createBrowserClient(supabaseUrl, supabaseAnonKey);
    } else {
      // Use traditional client for SSR if not using middleware
      return createClientOriginal(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
        }
      });
    }
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

// Lazy-load admin client to avoid server-side initialization errors
let adminClientInstance: ReturnType<typeof createClientOriginal> | null = null;

// Initialize admin client with service role key
function initAdminClient() {
  // Ensure we're in browser environment for this client
  if (typeof window === 'undefined') {
    console.error('Admin client can only be initialized in browser context');
    throw new Error('Admin client requires browser environment');
  }

  // Return existing instance if already created
  if (adminClientInstance) {
    return adminClientInstance;
  }

  // Get URL 
  const { url } = debugKeys();
  let supabaseUrl = url;
  let serviceRoleKey = '';
  
  // Get service role key
  if (window.ENV?.SUPABASE_SERVICE_ROLE_KEY) {
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
    adminClientInstance = createClientOriginal(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    return adminClientInstance;
  } catch (error) {
    console.error('Error creating admin Supabase client:', error);
    throw error;
  }
}

// Export Supabase client
export const supabase = initSupabaseClient();

// Export admin client as a getter to ensure it's only initialized in browser context
export const supabaseAdmin = typeof window !== 'undefined' ? initAdminClient() : null as any;

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
  if (typeof window === 'undefined') {
    console.error('Cannot delete artwork image outside browser context');
    return;
  }
  
  const adminClient = initAdminClient();
  const { error } = await adminClient.storage.from('artwork-images').remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Upload artwork image function
export async function uploadArtworkImage(file: File, artworkId: string, isPrimary: boolean = false) {
  if (typeof window === 'undefined') {
    throw new Error('Cannot upload artwork image outside browser context');
  }
  
  const adminClient = initAdminClient();
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${artworkId}/${fileName}`;
  
  // Upload the file
  const { error: uploadError, data } = await adminClient.storage
    .from('artwork-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }
  
  // Get the public URL
  const publicUrl = formatSupabaseUrl(`artwork-images/${filePath}`);
  
  // Add record to artwork_images table
  const { error: dbError } = await adminClient
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      file_path: filePath,
      is_primary: isPrimary
    });
  
  if (dbError) {
    // If DB insert fails, try to remove the uploaded file
    await adminClient.storage.from('artwork-images').remove([filePath]);
    throw new Error(`Failed to save image record: ${dbError.message}`);
  }
  
  return publicUrl;
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

// Format Supabase URL to avoid duplicate paths
export function formatSupabaseUrl(path: string): string {
  if (!path) return '';
  
  const { url } = debugKeys();
  const baseUrl = `${url}/storage/v1/object/public/`;
  
  // Remove any duplicate bucket names in the path
  const parts = path.split('/');
  const bucketName = parts[0];
  let cleanPath = path;
  
  if (parts.length > 1 && parts[1] === bucketName) {
    cleanPath = parts.slice(0, 1).concat(parts.slice(2)).join('/');
  }
  
  return `${baseUrl}${cleanPath}`;
}