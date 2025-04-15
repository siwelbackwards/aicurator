"use client";

import { createBrowserClient } from "@supabase/ssr";

// Strong singleton pattern with token tracking
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let lastAuthState: { url: string; key: string; authenticated: boolean } | null = null;

export const createClient = () => {
  // Skip if not in browser
  if (typeof window === 'undefined') {
    // Create a temporary client for SSR that won't be cached
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  // Get current auth state
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Check for auth state from localStorage
  let authenticated = false;
  try {
    // Use a consistent storage key format (consistent with lib/supabase.ts)
    const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const storageKey = `aicurator_auth_${ENV_PREFIX}`;
    const authData = localStorage.getItem(storageKey);
    authenticated = !!authData && authData.includes('"access_token"');
  } catch (e) {
    // Ignore storage errors
  }
  
  // Current auth state fingerprint
  const currentState = { url, key, authenticated };
  const stateChanged = !lastAuthState || 
    lastAuthState.url !== currentState.url || 
    lastAuthState.key !== currentState.key || 
    lastAuthState.authenticated !== currentState.authenticated;
  
  // Return existing client if available and state hasn't changed
  if (supabaseClient && !stateChanged) {
    return supabaseClient;
  }
  
  // Create new client and update state tracking
  supabaseClient = createBrowserClient(url, key);
  lastAuthState = currentState;
  
  return supabaseClient;
}; 