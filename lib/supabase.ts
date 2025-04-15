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

// Define a global interface that extends Window to include our Supabase clients
declare global {
  // For browser contexts
  interface Window {
    __SUPABASE_SINGLETON_CLIENT__?: SupabaseClient;
    __SUPABASE_SINGLETON_ADMIN__?: SupabaseClient;
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
  
  // For Node.js and other non-browser contexts
  var __SUPABASE_SINGLETON_CLIENT__: SupabaseClient | undefined;
  var __SUPABASE_SINGLETON_ADMIN__: SupabaseClient | undefined;
}

// Get the global object in any environment (browser or server)
const getGlobalObject = (): any => {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  return {};
};

/**
 * Supabase Singleton Service
 * Ensures only one instance of each client exists across the entire application
 */
class SupabaseService {
  private static url: string = '';
  private static anonKey: string = '';
  private static serviceKey: string = '';
  private static initialized = false;
  
  /**
   * Initialize the Supabase configuration
   */
  static initialize() {
    if (this.initialized) return;
    
    // Reset to default empty values
    this.url = '';
    this.anonKey = '';
    this.serviceKey = '';
    
    const globalObj = getGlobalObject();
    
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
  
  /**
   * Get the standard Supabase client
   * Returns a cached instance if available, or creates a new one
   */
  static getClient(): SupabaseClient {
    this.initialize();
    
    const globalObj = getGlobalObject();
    
    // Use the global cached singleton instance if available
    if (globalObj.__SUPABASE_SINGLETON_CLIENT__) {
      return globalObj.__SUPABASE_SINGLETON_CLIENT__;
    }
    
    // Create client-specific auth options based on environment
    const isServer = typeof window === 'undefined';
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const storageKey = `aicurator_auth_${ENV_PREFIX}`;
    
    // Define auth options based on environment
    const authOptions = isServer 
      ? {
          persistSession: false,
          autoRefreshToken: false
        }
      : {
          persistSession: true,
          storageKey, // Unique key for this environment
          autoRefreshToken: true,
          flowType: 'pkce' as const,
          debug: false
        };
    
    // Create a new client instance
    const client = createClient(this.url, this.anonKey, {
      auth: authOptions,
      global: {
        headers: {
          'x-client-info': 'aicurator-webapp',
          'x-client-singleton': 'true'
        }
      }
    });
    
    // Store in global singleton cache
    globalObj.__SUPABASE_SINGLETON_CLIENT__ = client;
    
    return client;
  }
  
  /**
   * Get the Supabase admin client with service role privileges
   * Returns a cached instance if available, or creates a new one
   */
  static getAdminClient(): SupabaseClient {
    this.initialize();
    
    const globalObj = getGlobalObject();
    
    // Use the global cached singleton instance if available
    if (globalObj.__SUPABASE_SINGLETON_ADMIN__) {
      return globalObj.__SUPABASE_SINGLETON_ADMIN__;
    }
    
    // Create unique storage key for this environment
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const storageKey = `aicurator_admin_${ENV_PREFIX}`;
    
    // Create a new admin client instance
    const adminClient = createClient(this.url, this.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey,
        debug: false
      },
      global: {
        headers: {
          'x-client-info': 'aicurator-admin',
          'x-client-singleton': 'true'
        }
      }
    });
    
    // Store in global singleton cache
    globalObj.__SUPABASE_SINGLETON_ADMIN__ = adminClient;
    
    return adminClient;
  }
  
  /**
   * Get a client with a specific authentication token
   * Note: These clients are NOT cached as they are specific to individual tokens
   */
  static getClientWithToken(token: string): SupabaseClient {
    this.initialize();
    
    // Generate a unique storage key based on token hash
    const tokenHash = this.hashString(token);
    const storageKey = `aicurator_token_${tokenHash}`;
    
    // Create a new client instance with the token
    return createClient(this.url, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey
      },
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-client-info': 'aicurator-token-client'
        }
      }
    });
  }
  
  /**
   * Helper method to hash a string (for creating unique token-based storage keys)
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
  
  /**
   * Validate JWT token format
   */
  private static isValidKey(key: string): boolean {
    return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
  }
  
  /**
   * Validate URL format
   */
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