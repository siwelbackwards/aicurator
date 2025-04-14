import { createClient as createClientOriginal } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

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
    // Add global client references to ensure true singletons
    __SUPABASE_CLIENT__?: any;
    __SUPABASE_ADMIN_CLIENT__?: any;
  }
}

// Get environment config
function getConfig() {
  let url = '';
  let anonKey = '';
  let serviceKey = '';
  
  // Browser environment
  if (typeof window !== 'undefined') {
    // Try window.ENV (from env.js)
    if (window.ENV?.NEXT_PUBLIC_SUPABASE_URL) {
      url = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
      anonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      serviceKey = window.ENV.SUPABASE_SERVICE_ROLE_KEY || '';
    } 
    // Then try process.env
    else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    }
  } 
  // Server environment
  else {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }
  
  // Fallback values if needed
  if (!isValidUrl(url) || !isValidKey(anonKey)) {
    url = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
    anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os";
  }
  
  if (!isValidKey(serviceKey)) {
    serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
  }
  
  return { url, anonKey, serviceKey };
}

// Validate key format
function isValidKey(key: string): boolean {
  // JWT tokens typically follow pattern: xxxxx.yyyyy.zzzzz
  return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get configuration
const config = getConfig();

/**
 * True singleton pattern using global reference and factory
 */
export function getSupabase() {
  // For server-side rendering, create a new instance each time
  if (typeof window === 'undefined') {
    return createClientOriginal(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  // For client-side, use the global singleton if it exists
  if (window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__;
  }

  // Create the client with a unique storage key
  const client = createBrowserClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      storageKey: 'aicurator_supabase_auth', // Unique storage key
      flowType: 'pkce',
      debug: false // Disable debug logs
    },
    global: {
      headers: {
        'x-client-info': 'aicurator-webapp'
      }
    }
  });

  // Store the instance globally
  window.__SUPABASE_CLIENT__ = client;
  return client;
}

/**
 * Admin client singleton
 */
export function getSupabaseAdmin() {
  // For server-side rendering, create a new instance each time
  if (typeof window === 'undefined') {
    return createClientOriginal(config.url, config.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  // For client-side, use the global singleton if it exists
  if (window.__SUPABASE_ADMIN_CLIENT__) {
    return window.__SUPABASE_ADMIN_CLIENT__;
  }

  // Create the client with a unique storage key
  const adminClient = createClientOriginal(config.url, config.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'aicurator_supabase_admin_auth', // Unique storage key
      debug: false // Disable debug logs
    }
  });

  // Store the instance globally
  window.__SUPABASE_ADMIN_CLIENT__ = adminClient;
  return adminClient;
}

// Export the singleton accessors
export const supabase = getSupabase();
export const supabaseAdmin = getSupabaseAdmin();

// Connection test function to check configuration
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('artworks').select('count()', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
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
  
  const admin = getSupabaseAdmin();
  
  const { error } = await admin.storage.from('artwork-images').remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Upload artwork image function
export async function uploadArtworkImage(file: File, artworkId: string, isPrimary: boolean = false) {
  if (typeof window === 'undefined') {
    throw new Error('Cannot upload artwork image outside browser context');
  }
  
  const admin = getSupabaseAdmin();
  
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${artworkId}/${fileName}`;
  
  // Upload the file
  const { error: uploadError, data } = await admin.storage
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
  const { error: dbError } = await admin
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      file_path: filePath,
      is_primary: isPrimary
    });
  
  if (dbError) {
    // If DB insert fails, try to remove the uploaded file
    await admin.storage.from('artwork-images').remove([filePath]);
    throw new Error(`Failed to save image record: ${dbError.message}`);
  }
  
  return publicUrl;
}

// Format Supabase URL to avoid duplicate paths
export function formatSupabaseUrl(path: string): string {
  if (!path) return '';
  
  const baseUrl = `${config.url}/storage/v1/object/public/`;
  
  // Remove any duplicate bucket names in the path
  const parts = path.split('/');
  const bucketName = parts[0];
  let cleanPath = path;
  
  if (parts.length > 1 && parts[1] === bucketName) {
    cleanPath = parts.slice(0, 1).concat(parts.slice(2)).join('/');
  }
  
  return `${baseUrl}${cleanPath}`;
}