import { createClient, SupabaseClient, GoTrueClient } from '@supabase/supabase-js';
import { getGoTrueClient } from './gotrue-singleton';

/**
 * Supabase client singleton implementation following recommended pattern
 * Implements a true singleton to avoid multiple client instantiations
 */

// Module-level singleton instances
let _clientSingleton: SupabaseClient | undefined;
let _adminSingleton: SupabaseClient | undefined;
// Shared auth instance to prevent multiple GoTrueClient instances
let _sharedGoTrueClient: GoTrueClient | undefined;

/**
 * Debug utility to check all Supabase client instances
 * Call this in your components if you're seeing multiple client warnings
 */
export function debugSupabaseClients() {
  if (typeof window === 'undefined') {
    console.log('[SupabaseDebug] Running on server - no global clients');
    return {
      moduleClients: {
        regular: !!_clientSingleton,
        admin: !!_adminSingleton
      },
      globalClients: {
        regular: false,
        admin: false,
      }
    };
  }
  
  console.log('[SupabaseDebug] Client instances:');
  console.log('- Module-level client:', !!_clientSingleton);
  console.log('- Module-level admin:', !!_adminSingleton);
  console.log('- Global client:', !!window.__SUPABASE_CLIENT__);
  console.log('- Global admin:', !!window.__SUPABASE_ADMIN__);
  
  return {
    moduleClients: {
      regular: !!_clientSingleton,
      admin: !!_adminSingleton
    },
    globalClients: {
      regular: !!window.__SUPABASE_CLIENT__,
      admin: !!window.__SUPABASE_ADMIN__,
    }
  };
}

// Get the global object in any environment (browser or server)
const getGlobalObject = (): any => {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  return {};
};

// Define global type extensions
declare global {
  // For browser contexts
  interface Window {
    __SUPABASE_CLIENT__?: SupabaseClient;
    __SUPABASE_ADMIN__?: SupabaseClient;
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
  var __SUPABASE_CLIENT__: SupabaseClient | undefined;
  var __SUPABASE_ADMIN__: SupabaseClient | undefined;
}

/**
 * Supabase Singleton Service
 * Ensures only one instance of each client exists across the entire application
 */
export class SupabaseService {
  private static url: string = '';
  private static anonKey: string = '';
  private static serviceKey: string = '';
  private static initialized = false;
  
  // Environment-specific prefix for storage keys
  private static ENV_PREFIX = typeof process !== 'undefined' && process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  
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
   * Create a single shared GoTrueClient to use across all Supabase clients
   * This is the key fix for the "Multiple GoTrueClient instances" warning
   */
  private static getSharedGoTrueClient(): GoTrueClient {
    if (typeof window === 'undefined') {
      // For server, create new instance each time (doesn't cause warnings)
      return new GoTrueClient({
        url: `${this.url}/auth/v1`,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      });
    }
    
    if (_sharedGoTrueClient) {
      console.debug('[Supabase] Reusing shared GoTrueClient');
      return _sharedGoTrueClient;
    }
    
    console.debug('[Supabase] Creating shared GoTrueClient');
    const storageKey = `aicurator_auth_${this.ENV_PREFIX}`;
    
    // Create a single GoTrueClient for all Supabase clients
    _sharedGoTrueClient = new GoTrueClient({
      url: `${this.url}/auth/v1`,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, 
      storageKey,
      flowType: 'pkce'
    });
    
    // Store on window for cross-module access
    if (window) {
      (window as any).__SHARED_GOTRUE__ = _sharedGoTrueClient;
    }
    
    return _sharedGoTrueClient;
  }
  
  /**
   * Static reference to track client instances
   */
  private static _clients = {
    standard: undefined as SupabaseClient | undefined,
    admin: undefined as SupabaseClient | undefined,
    serverless: undefined as SupabaseClient | undefined,
    isInitializing: {
      standard: false,
      admin: false,
      serverless: false
    }
  };
  
  /**
   * Synchronize module-level clients with global window clients
   * This ensures all references point to the same instances
   */
  private static syncClientReferences() {
    if (typeof window === 'undefined') return;
    
    console.debug('[Supabase] Synchronizing client references');
    
    // Sync standard client
    if (window.__SUPABASE_CLIENT__ && !SupabaseService._clients.standard) {
      console.debug('[Supabase] Found global client, syncing to module');
      SupabaseService._clients.standard = window.__SUPABASE_CLIENT__;
      _clientSingleton = window.__SUPABASE_CLIENT__;
    } else if (SupabaseService._clients.standard && !window.__SUPABASE_CLIENT__) {
      console.debug('[Supabase] Found module client, syncing to global');
      window.__SUPABASE_CLIENT__ = SupabaseService._clients.standard;
      _clientSingleton = SupabaseService._clients.standard;
    }
    
    // Sync admin client
    if (window.__SUPABASE_ADMIN__ && !SupabaseService._clients.admin) {
      console.debug('[Supabase] Found global admin, syncing to module');
      SupabaseService._clients.admin = window.__SUPABASE_ADMIN__;
      _adminSingleton = window.__SUPABASE_ADMIN__;
    } else if (SupabaseService._clients.admin && !window.__SUPABASE_ADMIN__) {
      console.debug('[Supabase] Found module admin, syncing to global');
      window.__SUPABASE_ADMIN__ = SupabaseService._clients.admin;
      _adminSingleton = SupabaseService._clients.admin;
    }
  }
  
  /**
   * Get Supabase client (browser or server)
   * Uses a singleton pattern to ensure only one client instance exists
   */
  static getClient(): SupabaseClient {
    // Always ensure we're initialized
    this.initialize();
    
    // Sync references to ensure module and global clients are in sync
    this.syncClientReferences();
    
    // First, check all possible singletons
    if (_clientSingleton) {
      console.debug('[Supabase] Using existing module-level client singleton');
      return _clientSingleton;
    }
    
    // First, check if we already have a client instance
    if (SupabaseService._clients.standard) {
      console.debug('[Supabase] Reusing existing standard client');
      // Store in module singleton too
      _clientSingleton = SupabaseService._clients.standard;
      return SupabaseService._clients.standard;
    }
    
    // If client is being initialized elsewhere, wait briefly to avoid race condition
    if (SupabaseService._clients.isInitializing.standard) {
      console.debug('[Supabase] Waiting for existing client initialization');
      return this.delayAndGetClient('standard');
    }
    
    // Check global singleton on window
    if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
      console.debug('[Supabase] Using existing global client from window');
      SupabaseService._clients.standard = window.__SUPABASE_CLIENT__;
      _clientSingleton = window.__SUPABASE_CLIENT__;
      return window.__SUPABASE_CLIENT__;
    }
    
    console.debug('[Supabase] Creating new standard client');
    SupabaseService._clients.isInitializing.standard = true;
    
    try {
      // Make sure we use any existing shared GoTrueClient
      let sharedGoTrue = null;
      
      if (typeof window !== 'undefined') {
        if (window.__SHARED_GOTRUE__) {
          console.debug('[Supabase] Using existing shared GoTrueClient from window');
          sharedGoTrue = window.__SHARED_GOTRUE__;
        } else {
          console.debug('[Supabase] Creating shared GoTrueClient');
          sharedGoTrue = this.getSharedGoTrueClient();
        }
      }
      
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            storageKey: 'aicurator_auth_' + SupabaseService.ENV_PREFIX,
          },
        }
      );
      
      // Use shared GoTrueClient to prevent "Multiple GoTrueClient instances" warnings
      if (sharedGoTrue) {
        try {
          // @ts-ignore - We're doing this to prevent multiple GoTrueClient instances
          client.auth.gotrue = sharedGoTrue;
        } catch (e) {
          console.error('[Supabase] Failed to set shared GoTrueClient:', e);
        }
      }
      
      // Store in all available singleton references
      SupabaseService._clients.standard = client;
      _clientSingleton = client;
      
      // Store in global variable for cross-file access
      if (typeof window !== 'undefined') {
        window.__SUPABASE_CLIENT__ = client;
      }
      
      return client;
    } finally {
      SupabaseService._clients.isInitializing.standard = false;
    }
  }
  
  /**
   * Get admin Supabase client
   * Uses a singleton pattern to ensure only one admin client instance exists
   */
  static getAdminClient(): SupabaseClient {
    // Always ensure we're initialized
    this.initialize();
    
    // Sync references to ensure module and global clients are in sync
    this.syncClientReferences();
    
    // First check module singleton
    if (_adminSingleton) {
      console.debug('[Supabase] Using existing module-level admin singleton');
      return _adminSingleton;
    }
    
    // First, check if we already have a client instance
    if (SupabaseService._clients.admin) {
      console.debug('[Supabase] Reusing existing admin client');
      // Store in module singleton too
      _adminSingleton = SupabaseService._clients.admin;
      return SupabaseService._clients.admin;
    }
    
    // If client is being initialized elsewhere, wait briefly to avoid race condition
    if (SupabaseService._clients.isInitializing.admin) {
      console.debug('[Supabase] Waiting for existing admin client initialization');
      return this.delayAndGetClient('admin');
    }
    
    // Check global singleton
    if (typeof window !== 'undefined' && window.__SUPABASE_ADMIN__) {
      console.debug('[Supabase] Using existing global admin client from window');
      SupabaseService._clients.admin = window.__SUPABASE_ADMIN__;
      _adminSingleton = window.__SUPABASE_ADMIN__;
      return window.__SUPABASE_ADMIN__;
    }
    
    console.debug('[Supabase] Creating new admin client');
    SupabaseService._clients.isInitializing.admin = true;
    
    try {
      // CRITICAL: First get the shared GoTrueClient BEFORE creating the admin client
      // This ensures we won't create a new GoTrueClient instance during admin client creation
      let sharedGoTrue = null;
      
      if (typeof window !== 'undefined') {
        // Try to get existing shared GoTrueClient from any possible source
        if (window.__SHARED_GOTRUE__) {
          console.debug('[Supabase] Using existing shared GoTrueClient from window');
          sharedGoTrue = window.__SHARED_GOTRUE__;
        } else if (this._clients.standard?.auth) {
          console.debug('[Supabase] Using GoTrueClient from standard client');
          // @ts-ignore
          sharedGoTrue = this._clients.standard.auth.gotrue;
        } else {
          console.debug('[Supabase] Creating shared GoTrueClient for admin');
          sharedGoTrue = this.getSharedGoTrueClient();
        }
      }
      
      // Create the admin client with minimal auth options
      // The key is to avoid triggering a new GoTrueClient creation
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false, // No need to persist admin sessions
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );
      
      // CRITICAL: Replace the auth.gotrue with our shared instance
      if (sharedGoTrue) {
        try {
          // @ts-ignore - We're doing this to prevent multiple GoTrueClient instances
          adminClient.auth.gotrue = sharedGoTrue;
          console.debug('[Supabase] Attached shared GoTrueClient to admin client');
        } catch (e) {
          console.error('[Supabase] Failed to attach shared GoTrueClient to admin client:', e);
        }
      }
      
      // Store in all singleton locations
      SupabaseService._clients.admin = adminClient;
      _adminSingleton = adminClient;
      
      // Store in global variable for cross-file access
      if (typeof window !== 'undefined') {
        window.__SUPABASE_ADMIN__ = adminClient;
      }
      
      return adminClient;
    } finally {
      SupabaseService._clients.isInitializing.admin = false;
    }
  }
  
  /**
   * Helper method to wait for client initialization and return
   * Used to avoid race conditions during concurrent client initialization
   */
  private static delayAndGetClient(type: 'standard' | 'admin' | 'serverless'): SupabaseClient {
    // In real implementation, this would use a promise or callback
    // For simplicity, we'll just delay briefly and return
    console.debug(`[Supabase] Delaying to avoid race condition for ${type} client`);
    
    // Simplified delay-retry mechanism
    // In a real app, you might want to use a more sophisticated approach
    for (let i = 0; i < 3; i++) {
      if (type === 'standard' && SupabaseService._clients.standard) {
        return SupabaseService._clients.standard;
      }
      if (type === 'admin' && SupabaseService._clients.admin) {
        return SupabaseService._clients.admin;
      }
      if (type === 'serverless' && SupabaseService._clients.serverless) {
        return SupabaseService._clients.serverless;
      }
      
      // Wait a bit (this is simplified - you'd use async/await in a real implementation)
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Busy wait
      }
    }
    
    // If we still don't have a client, create a new one as fallback
    console.debug(`[Supabase] Client still not available after delay, creating new ${type} client`);
    
    if (type === 'standard') {
      SupabaseService._clients.isInitializing.standard = false; // Reset flag
      return this.getClient();
    } 
    if (type === 'admin') {
      SupabaseService._clients.isInitializing.admin = false; // Reset flag
      return this.getAdminClient();
    }
    
    // Serverless - should never reach here in normal operation
    return this.getClient();
  }
  
  /**
   * Get a client with a specific authentication token
   * Note: These clients are NOT cached as they are specific to individual tokens
   */
  static getClientWithToken(token: string): SupabaseClient {
    this.initialize();
    
    // Generate a unique storage key based on token hash
    const tokenHash = this.hashString(token);
    
    // Create a new client instance with the token
    const client = createClient(
      this.url, 
      this.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-client-info': 'aicurator-token-client'
          }
        }
      }
    );
    
    // If we're in the browser, replace the auth property with our shared instance
    if (typeof window !== 'undefined') {
      // Get shared auth instance
      const sharedAuth = this.getSharedGoTrueClient();
      
      // Replace the auth property (this is the key fix)
      // @ts-ignore - We're doing this to prevent multiple GoTrueClient instances
      client.auth = sharedAuth;
    }
    
    return client;
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

/**
 * Initialize the Supabase service and return a reference
 * This ensures we have a consistent way to access the service from hooks
 */
export function initializeSupabaseService(): SupabaseService {
  SupabaseService.initialize();
  return SupabaseService;
}

// Create the clients once at module initialization
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

/**
 * Force a clean global client initialization
 * Use this if you're seeing "Multiple GoTrueClient instances" warnings
 */
export function resetSupabaseClients() {
  if (typeof window === 'undefined') {
    console.debug('[Supabase] Cannot reset clients on server side');
    return false;
  }
  
  console.debug('[Supabase] Resetting all client instances for clean initialization');
  
  // Reset module-level singletons
  _clientSingleton = undefined;
  _adminSingleton = undefined;
  
  // Reset global instances
  window.__SUPABASE_CLIENT__ = undefined;
  window.__SUPABASE_ADMIN__ = undefined;
  
  // Delete auth state from localStorage
  const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  const storageKey = `aicurator_auth_${ENV_PREFIX}`;
  const adminKey = `aicurator_admin_${ENV_PREFIX}`;
  
  // Find and clear any supabase-related localStorage items
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes(storageKey) || key.includes(adminKey) || key.includes('aicurator')) {
      console.debug(`[Supabase] Removing storage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Initialize fresh clients
  const client = SupabaseService.getClient();
  const adminClient = SupabaseService.getAdminClient();
  
  console.debug('[Supabase] Clients have been reset and reinitialized');
  return true;
}

// Add client inspector function to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).inspectSupabaseClients = () => {
    console.group('Supabase Client Inspection');
    
    // Check for module-level singletons
    console.log('Module-level client singleton:', !!_clientSingleton);
    console.log('Module-level admin singleton:', !!_adminSingleton);
    
    // Check for global object instances
    console.log('Global window.__SUPABASE_CLIENT__:', !!window.__SUPABASE_CLIENT__);
    console.log('Global window.__SUPABASE_ADMIN__:', !!window.__SUPABASE_ADMIN__);
    
    // Check for reference equality
    if (_clientSingleton && window.__SUPABASE_CLIENT__) {
      console.log('Client reference equality:', _clientSingleton === window.__SUPABASE_CLIENT__);
    }
    
    if (_adminSingleton && window.__SUPABASE_ADMIN__) {
      console.log('Admin reference equality:', _adminSingleton === window.__SUPABASE_ADMIN__);
    }
    
    // Check auth configuration
    if (window.__SUPABASE_CLIENT__) {
      const clientAuth = (window.__SUPABASE_CLIENT__ as any).auth;
      console.log('Client auth config:', {
        storageKey: clientAuth?.storageKey,
        persistSession: clientAuth?.persistSession,
        detectSessionInUrl: clientAuth?.detectSessionInUrl,
        autoRefreshToken: clientAuth?.autoRefreshToken
      });
    }
    
    // Check for potential other instances
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const expectedStorageKey = `aicurator_auth_${ENV_PREFIX}`;
    
    console.log('Expected storage key:', expectedStorageKey);
    console.log('Storage keys in localStorage:', Object.keys(localStorage).filter(
      key => key.includes('supabase') || key.includes('aicurator')
    ));
    
    console.groupEnd();
    
    return {
      moduleClient: _clientSingleton,
      moduleAdmin: _adminSingleton,
      globalClient: window.__SUPABASE_CLIENT__,
      globalAdmin: window.__SUPABASE_ADMIN__,
      referenceEquality: {
        client: _clientSingleton === window.__SUPABASE_CLIENT__,
        admin: _adminSingleton === window.__SUPABASE_ADMIN__
      }
    };
  };
  
  console.debug('[Supabase] Inspector added to window.inspectSupabaseClients()');
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