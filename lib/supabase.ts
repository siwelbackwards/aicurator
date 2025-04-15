import { createClient as createClientOriginal, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client singleton class
 * This implementation follows a true singleton pattern to ensure
 * only one instance of each client exists in the entire application
 */
class SupabaseClientSingleton {
  // Static instance storage
  private static instance: SupabaseClientSingleton;
  
  // Client instances
  private _client: SupabaseClient | null = null;
  private _adminClient: SupabaseClient | null = null;
  
  // Config
  private _url: string = '';
  private _anonKey: string = '';
  private _serviceKey: string = '';
  
  // Initialization state
  private _initialized: boolean = false;
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SupabaseClientSingleton {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = new SupabaseClientSingleton();
    }
    return SupabaseClientSingleton.instance;
  }
  
  /**
   * Initialize with configuration
   */
  public initialize(): void {
    if (this._initialized) return;
    
    this._url = '';
    this._anonKey = '';
    this._serviceKey = '';
    
    // Get environment config - Browser environment
    if (typeof window !== 'undefined') {
      // Try window.ENV (from env.js)
      if (window.ENV?.NEXT_PUBLIC_SUPABASE_URL) {
        this._url = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
        this._anonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this._serviceKey = window.ENV.SUPABASE_SERVICE_ROLE_KEY || '';
      } 
      // Try Netlify environment variables
      else if (window._env_?.NEXT_PUBLIC_SUPABASE_URL) {
        this._url = window._env_.NEXT_PUBLIC_SUPABASE_URL;
        this._anonKey = window._env_.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this._serviceKey = window._env_.SUPABASE_SERVICE_ROLE_KEY || '';
      }
      // Then try process.env
      else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        this._url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        this._anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        this._serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      }
    } 
    // Server environment
    else {
      this._url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      this._anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      this._serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    }
    
    // Fallback values if needed
    if (!this.isValidUrl(this._url) || !this.isValidKey(this._anonKey)) {
      this._url = "https://cpzzmpgbyzcqbwkaaqdy.supabase.co";
      this._anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os";
    }
    
    if (!this.isValidKey(this._serviceKey)) {
      this._serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0NzAwMSwiZXhwIjoyMDU5NTIzMDAxfQ.1fjCF_WyFoRq_8THFURMosh3txmDaLsx7degHyYIycw";
    }
    
    this._initialized = true;
  }
  
  /**
   * Get the standard client
   */
  public getClient(): SupabaseClient {
    if (!this._initialized) this.initialize();
    
    if (!this._client) {
      try {
        // Create unique storage key with app name and environment prefix
        const storageKey = `aicurator_auth_${process.env.NODE_ENV || 'development'}`;
        
        if (typeof window === 'undefined') {
          // Server-side client
          this._client = createClientOriginal(this._url, this._anonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            }
          });
        } else {
          // Browser client
          this._client = createBrowserClient(this._url, this._anonKey, {
            auth: {
              persistSession: true,
              storageKey,
              flowType: 'pkce' as const,
              debug: false,
              autoRefreshToken: true,
            },
            global: {
              headers: {
                'x-client-info': 'aicurator-webapp',
                'x-client-singleton': 'true'
              }
            }
          });
        }
      } catch (error) {
        console.error('Error creating Supabase client:', error);
        
        // Fallback to basic client
        this._client = createClientOriginal(this._url, this._anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'aicurator_auth_fallback'
          }
        });
      }
    }
    
    return this._client;
  }
  
  /**
   * Get the admin client
   */
  public getAdminClient(): SupabaseClient {
    if (!this._initialized) this.initialize();
    
    if (!this._adminClient) {
      // Create unique storage key with app name and environment prefix
      const storageKey = `aicurator_admin_${process.env.NODE_ENV || 'development'}`;
      
      this._adminClient = createClientOriginal(this._url, this._serviceKey, {
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
    }
    
    return this._adminClient;
  }
  
  /**
   * Get a client with a specific token
   */
  public getClientWithToken(token: string): SupabaseClient {
    if (!this._initialized) this.initialize();
    
    return createClientOriginal(this._url, this._anonKey, {
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
  
  /**
   * Helper methods
   */
  private isValidKey(key: string): boolean {
    return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Add type definition for window
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

// Initialize singleton instance
const supabaseSingleton = SupabaseClientSingleton.getInstance();
supabaseSingleton.initialize();

// Export clients
export const supabase = supabaseSingleton.getClient();
export const supabaseAdmin = supabaseSingleton.getAdminClient();

// Export helper function for token-based clients
export function getClientWithToken(token: string): SupabaseClient {
  return supabaseSingleton.getClientWithToken(token);
}

// Format Supabase URL to avoid duplicate paths
export function formatSupabaseUrl(path: string): string {
  if (!path) return '';
  
  const baseUrl = `${supabaseSingleton['_url']}/storage/v1/object/public/`;
  
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