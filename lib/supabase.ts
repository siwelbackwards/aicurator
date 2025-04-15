import { createClient as createClientOriginal, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Declare global namespace for our singletons
declare global {
  var __supabase__: {
    client: SupabaseClient | null;
    adminClient: SupabaseClient | null;
    clientToken: string | null;
    adminToken: string | null;
  };
  
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

// Initialize the global singleton object if it doesn't exist
if (typeof globalThis !== 'undefined' && !globalThis.__supabase__) {
  globalThis.__supabase__ = {
    client: null,
    adminClient: null,
    clientToken: null,
    adminToken: null
  };
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
    // Try Netlify environment variables
    else if (window._env_?.NEXT_PUBLIC_SUPABASE_URL) {
      url = window._env_.NEXT_PUBLIC_SUPABASE_URL;
      anonKey = window._env_.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      serviceKey = window._env_.SUPABASE_SERVICE_ROLE_KEY || '';
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
 * Get a Supabase client with global singleton pattern
 */
export function getSupabase(accessToken?: string | null): SupabaseClient {
  // For server-side rendering, create a new instance each time without caching
  if (typeof globalThis === 'undefined' || typeof window === 'undefined') {
    return createClientOriginal(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  // If the token is the same and we have a cached client, return it
  if (accessToken === globalThis.__supabase__.clientToken && globalThis.__supabase__.client !== null) {
    return globalThis.__supabase__.client;
  }

  // Update the last token
  globalThis.__supabase__.clientToken = accessToken || null;

  // Create client headers
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    headers['x-client-info'] = 'aicurator-webapp';
  }

  // Create the client with the proper options
  const clientOptions = {
    auth: {
      persistSession: true,
      storageKey: 'aicurator_auth_token', // Unique storage key
      flowType: 'pkce' as const, // Type assertion to allow TypeScript to infer the correct type
      debug: false,
      autoRefreshToken: true,
    },
    global: {
      headers
    }
  };

  // Create a new client
  try {
    const client = createBrowserClient(config.url, config.anonKey, clientOptions);
    globalThis.__supabase__.client = client;
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    
    // Create a fallback client if the browser client fails
    const fallbackClient = createClientOriginal(config.url, config.anonKey, clientOptions);
    globalThis.__supabase__.client = fallbackClient;
    return fallbackClient;
  }
}

/**
 * Get a Supabase admin client with global singleton pattern
 */
export function getSupabaseAdmin(accessToken?: string | null): SupabaseClient {
  // For server-side rendering, create a new instance each time without caching
  if (typeof globalThis === 'undefined' || typeof window === 'undefined') {
    return createClientOriginal(config.url, config.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  // If the token is the same and we have a cached admin client, return it
  if (accessToken === globalThis.__supabase__.adminToken && globalThis.__supabase__.adminClient !== null) {
    return globalThis.__supabase__.adminClient;
  }

  // Update the last admin token
  globalThis.__supabase__.adminToken = accessToken || null;

  // Create admin headers
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    headers['x-client-info'] = 'aicurator-admin';
  }

  // Create the client with the token
  const adminClient = createClientOriginal(
    config.url,
    accessToken ? config.anonKey : config.serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'aicurator_admin_token',
        debug: false
      },
      global: {
        headers
      }
    }
  );

  // Update the cached admin client
  globalThis.__supabase__.adminClient = adminClient;
  return adminClient;
}

// Create lazily initialized exports
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Getter functions for the exports
export function supabase(): SupabaseClient {
  if (_supabase === null) {
    _supabase = getSupabase();
  }
  return _supabase;
}

export function supabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin === null) {
    _supabaseAdmin = getSupabaseAdmin();
  }
  return _supabaseAdmin;
}

// Connection test function to check configuration
export async function testConnection() {
  try {
    const client = supabase();
    const { data, error } = await client.from('artworks').select('count()', { count: 'exact' }).limit(1);
    
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