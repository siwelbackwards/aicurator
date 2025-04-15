import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton implementation following recommended pattern
 * Implements a true singleton to avoid multiple client instantiations
 */

interface GotrueOptions {
  detectSessionInUrl?: boolean;
  flowType?: 'pkce' | 'implicit';
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  storageKey?: string;
  debug?: boolean;
}

// Global namespace declaration to hold client instances
declare global {
  var supabase: SupabaseClient | undefined;
  var supabaseAdmin: SupabaseClient | undefined;
  
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

class SupabaseService {
  private static url: string = '';
  private static anonKey: string = '';
  private static serviceKey: string = '';
  private static initialized = false;
  
  static initialize() {
    if (this.initialized) return;
    
    // Get environment config
    this.url = '';
    this.anonKey = '';
    this.serviceKey = '';
    
    // Browser environment
    if (typeof window !== 'undefined') {
      // Try window.ENV (from env.js)
      if (window.ENV?.NEXT_PUBLIC_SUPABASE_URL) {
        this.url = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        this.anonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this.serviceKey = window.ENV.SUPABASE_SERVICE_ROLE_KEY || '';
      } 
      // Try Netlify environment variables
      else if (window._env_?.NEXT_PUBLIC_SUPABASE_URL) {
        this.url = window._env_.NEXT_PUBLIC_SUPABASE_URL;
        this.anonKey = window._env_.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this.serviceKey = window._env_.SUPABASE_SERVICE_ROLE_KEY || '';
      }
      // Then try process.env
      else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        this.url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      }
    } 
    // Server environment
    else {
      this.url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    
    // Fallback values if needed
    if (!this.isValidUrl(this.url) || !this.isValidKey(this.anonKey)) {
      this.url = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
      this.anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os";
    }
    
    if (!this.isValidKey(this.serviceKey)) {
      this.serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
    }
    
    this.initialized = true;
  }
  
  static getClient(): SupabaseClient {
    this.initialize();
    
    // Use the global variable to maintain the singleton
    if (!global.supabase) {
      // Check if we're on the server or client
      const isServer = typeof window === 'undefined';
      
      // Create client-specific auth options
      const authOptions: GotrueOptions = isServer 
        ? {
            persistSession: false,
            autoRefreshToken: false
          }
        : {
            persistSession: true,
            storageKey: 'aicurator_auth_token',
            autoRefreshToken: true,
            flowType: 'pkce',
            debug: false
          };
      
      // Create the client
      global.supabase = createClient(this.url, this.anonKey, {
        auth: authOptions,
        global: {
          headers: {
            'x-client-info': 'aicurator-webapp',
            'x-client-singleton': 'true'
          }
        }
      });
    }
    
    return global.supabase;
  }
  
  static getAdminClient(): SupabaseClient {
    this.initialize();
    
    // Use the global variable to maintain the singleton
    if (!global.supabaseAdmin) {
      global.supabaseAdmin = createClient(this.url, this.serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storageKey: 'aicurator_admin_token',
          debug: false
        },
        global: {
          headers: {
            'x-client-info': 'aicurator-admin',
            'x-client-singleton': 'true'
          }
        }
      });
    }
    
    return global.supabaseAdmin;
  }
  
  static getClientWithToken(token: string): SupabaseClient {
    this.initialize();
    
    // For token-based clients, create a new instance each time
    return createClient(this.url, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: `aicurator_token_client_${Date.now()}`
      },
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-client-info': 'aicurator-token-client'
        }
      }
    });
  }
  
  private static isValidKey(key: string): boolean {
    return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
  }
  
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export static clients directly
export const supabase = SupabaseService.getClient();
export const supabaseAdmin = SupabaseService.getAdminClient();

// Export helper function for token-based clients
export function getClientWithToken(token: string): SupabaseClient {
  return SupabaseService.getClientWithToken(token);
}

// Format Supabase URL to avoid duplicate paths
export function formatSupabaseUrl(path: string): string {
  if (!path) return '';
  
  const baseUrl = `${SupabaseService['url']}/storage/v1/object/public/`;
  
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
  
  const { error } = await supabaseAdmin.storage.from('artwork-images').remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

// Upload artwork image function
export async function uploadArtworkImage(file: File, artworkId: string, isPrimary: boolean = false) {
  if (typeof window === 'undefined') {
    throw new Error('Cannot upload artwork image outside browser context');
  }
  
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${artworkId}/${fileName}`;
  
  // Upload the file
  const { error: uploadError, data } = await supabaseAdmin.storage
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
  const { error: dbError } = await supabaseAdmin
    .from('artwork_images')
    .insert({
      artwork_id: artworkId,
      file_path: filePath,
      is_primary: isPrimary
    });
  
  if (dbError) {
    // If DB insert fails, try to remove the uploaded file
    await supabaseAdmin.storage.from('artwork-images').remove([filePath]);
    throw new Error(`Failed to save image record: ${dbError.message}`);
  }
  
  return publicUrl;
}

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