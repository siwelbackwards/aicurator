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

// Create config with more direct approach to avoid hydration issues
const config = getConfig();

// Log configuration (without sensitive data)
console.log('Supabase URL configured:', config.url);
console.log('Supabase API key available:', !!config.anonKey);

// Create a single Supabase client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Create and export the Supabase client
export const supabase = (() => {
  try {
  if (!supabaseClient) {
      // Make sure URL and key are valid before creating client
      if (!config.url || !config.anonKey) {
        throw new Error('Missing Supabase URL or API key');
      }
      
      // Create the Supabase client with explicit headers
    supabaseClient = createBrowserClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        storageKey: 'supabase-auth',
        flowType: 'pkce',
          detectSessionInUrl: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`
          }
      }
    });
  }
  return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
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
      }
    } as any;
  }
})();

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