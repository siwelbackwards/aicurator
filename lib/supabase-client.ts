import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { formatSupabaseUrl } from '@/lib/utils';

// Add TypeScript declaration for Window with ENV
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      [key: string]: any;
    };
    // Add tab sync properties
    __supabase_session_sync?: boolean;
    __supabase_client_initialized?: boolean;
    __existing_supabase_client?: any;
  }
}

// Hard-coded fallback values for development
const FALLBACK_URL = 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwenptcGdieXpjcWJ3a2FhcWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDcwMDEsImV4cCI6MjA1OTUyMzAwMX0.yN5KM7w8AjsXFOwdpQ4Oy7-Pf7D58fohL1tgnFBK_os';

// Get environment config with more direct approach
function getConfig() {
  // First check for explicit environment variables
  let url = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let anonKey = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Try window.ENV as a fallback (client-side only)
  if (typeof window !== 'undefined' && window.ENV) {
    if (!url && window.ENV.NEXT_PUBLIC_SUPABASE_URL) {
      url = window.ENV.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (!anonKey && window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      anonKey = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  } 
  
  // Use fallbacks if needed
  if (!url || !isValidUrl(url)) {
    console.warn('Using fallback Supabase URL');
    url = FALLBACK_URL;
  }
  
  if (!anonKey || !isValidKey(anonKey)) {
    console.warn('Using fallback Supabase API key');
    anonKey = FALLBACK_KEY;
  }
  
  return { url, anonKey };
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
  return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key);
}

// Session synchronization across tabs
class SessionSyncManager {
  private static instance: SessionSyncManager;
  private syncInProgress = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5000; // 5 seconds cooldown between syncs

  static getInstance(): SessionSyncManager {
    if (!SessionSyncManager.instance) {
      SessionSyncManager.instance = new SessionSyncManager();
    }
    return SessionSyncManager.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      // Listen for storage events (cross-tab communication)
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Listen for focus events to sync when tab becomes active
      window.addEventListener('focus', this.handleFocus.bind(this));
      
      // Set up periodic sync (every 5 minutes)
      setInterval(() => {
        this.syncSession();
      }, 5 * 60 * 1000);
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'supabase.auth.token' && event.newValue !== event.oldValue) {
      console.log('🔄 Session changed in another tab, syncing...');
      this.syncSession();
    }
  }

  private handleFocus() {
    // Sync when tab gets focus (user switches to this tab)
    this.syncSession();
  }

  async syncSession() {
    if (this.syncInProgress) return;
    
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      return; // Too soon since last sync
    }

    this.syncInProgress = true;
    this.lastSyncTime = now;

    try {
      if (supabaseClient) {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (!error && session) {
          // Trigger auth state change to update UI
          console.log('🔄 Session synced successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error syncing session:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
}

// Create config with more direct approach to avoid hydration issues
const config = getConfig();

// Log configuration (without sensitive data)
console.log('Supabase URL configured:', config.url);
console.log('Supabase API key available:', !!config.anonKey);

// Create a single Supabase client instance with proper multi-tab configuration
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Create and export the Supabase client
export const supabase = (() => {
  try {
    if (!supabaseClient && typeof window !== 'undefined') {
      // Ensure we only create one client per window
      if (window.__supabase_client_initialized) {
        console.warn('⚠️ Attempting to create multiple Supabase clients');
        return window.__existing_supabase_client || null;
      }

      // Make sure URL and key are valid before creating client
      if (!config.url || !config.anonKey) {
        throw new Error('Missing Supabase URL or API key');
      }
      
      // Create the Supabase client with multi-tab optimized configuration
      supabaseClient = createBrowserClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token', // Consistent storage key
          flowType: 'pkce',
          detectSessionInUrl: true,
          autoRefreshToken: true,
          // Optimize for multi-tab scenarios
          storage: {
            getItem: (key: string) => {
              if (typeof window !== 'undefined') {
                return window.localStorage.getItem(key);
              }
              return null;
            },
            setItem: (key: string, value: string) => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
                // Notify other tabs about session changes
                window.dispatchEvent(new StorageEvent('storage', {
                  key,
                  newValue: value,
                  storageArea: window.localStorage
                }));
              }
            },
            removeItem: (key: string) => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                // Notify other tabs about session removal
                window.dispatchEvent(new StorageEvent('storage', {
                  key,
                  newValue: null,
                  storageArea: window.localStorage
                }));
              }
            }
          }
        },
        global: {
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`
          }
        }
      });

      // Mark client as initialized
      window.__supabase_client_initialized = true;
      (window as any).__existing_supabase_client = supabaseClient;

      // Initialize session sync manager
      const sessionSync = SessionSyncManager.getInstance();

      // Set up auth state change listener with better error handling
      supabaseClient.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔄 Auth state changed:', event, session ? 'Session active' : 'No session');
        
        try {
          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              console.log('✅ User signed in');
              if (typeof window !== 'undefined') {
                localStorage.setItem('userAuthenticated', 'true');
              }
              break;
            
            case 'SIGNED_OUT':
              console.log('👋 User signed out');
              if (typeof window !== 'undefined') {
                localStorage.removeItem('userAuthenticated');
                // Clear any cached data
                const event = new CustomEvent('auth:signout');
                window.dispatchEvent(event);
              }
              break;
            
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token refreshed');
              // Sync with other tabs after token refresh
              setTimeout(() => sessionSync.syncSession(), 100);
              break;
            
            case 'PASSWORD_RECOVERY':
              console.log('🔑 Password recovery initiated');
              break;
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
        }
      });

      console.log('✅ Supabase client initialized successfully');
    }
    
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    // Return a dummy client that logs errors instead of throwing
    return {
      from: () => {
        console.error('Supabase client not properly initialized');
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: { message: 'Client not initialized' } })
              })
            })
          })
        };
      },
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Client not initialized' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: { message: 'Client not initialized' } })
      }
    } as any;
  }
})();

// Utility function to refresh session manually
export const refreshSession = async () => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession();
      if (error) {
        console.error('❌ Error refreshing session:', error);
        return false;
      }
      console.log('✅ Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception refreshing session:', error);
      return false;
    }
  }
  return false;
};

// Utility function to check if session is still valid
export const isSessionValid = async () => {
  if (supabaseClient) {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.error('❌ Error checking session:', error);
        return false;
      }
      
      if (!session) {
        return false;
      }
      
      // Check if token is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      
      return (expiresAt - now) > fiveMinutes;
    } catch (error) {
      console.error('❌ Exception checking session validity:', error);
      return false;
    }
  }
  return false;
};

// Export the config for use in formatSupabaseUrl and other functions
export const supabaseConfig = config; 