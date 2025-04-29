import { createBrowserClient } from '@supabase/ssr';
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

// Create a single Supabase client instance
let supabaseClient: ReturnType<typeof createClientOriginal> | null = null;
let adminClient: ReturnType<typeof createClientOriginal> | null = null;

// Get or create the Supabase client
export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  const config = getConfig();
  
  if (typeof window === 'undefined') {
    // Server-side client
    supabaseClient = createClientOriginal(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } else {
    // Client-side browser client
    supabaseClient = createBrowserClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        storageKey: 'supabase-auth',
        flowType: 'pkce',
      }
    });
  }

  return supabaseClient;
};

// Get or create the admin client
export const getAdminClient = () => {
  if (adminClient) return adminClient;

  const config = getConfig();
  adminClient = createClientOriginal(config.url, config.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  return adminClient;
};

// Format Supabase URL to avoid duplicate paths
export function formatSupabaseUrl(path: string): string {
  if (!path) return '';
  
  const config = getConfig();
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

// Artwork image functions
export async function deleteArtworkImage(filePath: string) {
  if (typeof window === 'undefined') {
    console.error('Cannot delete artwork image outside browser context');
    return;
  }
  
  const admin = getAdminClient();
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
  
  const admin = getAdminClient();
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

// Connection test function
export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const supabase = getSupabaseClient();
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