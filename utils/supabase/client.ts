"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { getGoTrueClient } from "@/lib/gotrue-singleton";

// Module-level singleton client instance
let clientSingleton: ReturnType<typeof createBrowserClient> | undefined;

// Track if we've already created a client to prevent race conditions
let isClientInitializing = false;

/**
 * Creates a Supabase client for use in the browser - implements singleton pattern to 
 * avoid multiple client instances and prevent "Multiple GoTrueClient instances" warnings
 */
export const createClient = () => {
  // Server-side execution should always create a new non-persistent client
  if (typeof window === 'undefined') {
    console.debug('[utils/client] Creating temporary SSR client');
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }
  
  // For client-side, first check global instances from lib/supabase.ts
  if (window.__SUPABASE_CLIENT__) {
    console.debug('[utils/client] Using existing global Supabase client');
    return window.__SUPABASE_CLIENT__;
  }
  
  // If a client is already being initialized, wait for it
  if (isClientInitializing) {
    console.debug('[utils/client] Client initialization in progress, waiting...');
    return window.__SUPABASE_CLIENT__ || clientSingleton;
  }
  
  // If we already have a module-level singleton, return it
  if (clientSingleton) {
    console.debug('[utils/client] Using existing client singleton');
    
    // Also make sure it's set in the global object for cross-module consistency
    if (!window.__SUPABASE_CLIENT__) {
      window.__SUPABASE_CLIENT__ = clientSingleton;
    }
    
    return clientSingleton;
  }
  
  // Need to create a new client
  isClientInitializing = true;
  console.debug('[utils/client] Creating new browser client');
  
  try {
    // Create with storageKey matching the one in lib/supabase.ts
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const storageKey = `aicurator_auth_${ENV_PREFIX}`;
    
    // Get the shared auth client before creating the browser client
    const sharedGoTrue = getGoTrueClient({
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey
    });
    
    clientSingleton = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          detectSessionInUrl: false,
          persistSession: true,
          storageKey, // Match storage key in lib/supabase.ts
          autoRefreshToken: true
        },
        global: {
          // Add debugging headers to track client origin
          headers: {
            'x-client-info': 'utils-client-singleton',
          }
        }
      }
    );
    
    // This is the critical part - replace the auth client
    // @ts-ignore - We're doing this to prevent multiple GoTrueClient instances
    clientSingleton.auth.gotrue = sharedGoTrue;
    
    // Store reference on window for cross-file access
    window.__SUPABASE_CLIENT__ = clientSingleton;
    console.debug('[utils/client] New browser client created and stored globally');
  } finally {
    isClientInitializing = false;
  }
  
  return clientSingleton;
}

// Match the global Window interface from lib/supabase.ts
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: SupabaseClient;
    __SHARED_GOTRUE__?: any;
  }
} 