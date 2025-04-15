"use client";

import { GoTrueClient } from '@supabase/supabase-js';

// Define window extensions for our global objects
declare global {
  interface Window {
    __GO_TRUE_CLIENT__?: GoTrueClient;
    __SHARED_GOTRUE__?: GoTrueClient;
    __RESET_GOTRUE__?: () => void;
    GoTrueClient?: any;
    supabase?: {
      auth?: {
        goTrueClient?: GoTrueClient;
        [key: string]: any;
      };
      [key: string]: any;
    };
  }
}

// Global singleton for GoTrueClient
let goTrueClientInstance: GoTrueClient | undefined;

// Add a flag to prevent automatic recreation after reset
let preventAutoRecreation = false;

// Define a storage key to make it consistent
const ENV_PREFIX = typeof process !== 'undefined' && process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const STORAGE_KEY = `aicurator_auth_${ENV_PREFIX}`;

/**
 * Ensure only one GoTrueClient instance exists in the application
 * This is a direct workaround for the "Multiple GoTrueClient instances" warning
 */
export function getGoTrueClient(options?: any): GoTrueClient {
  // Special flag for server-side rendering
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // For server side, we create a new instance each time
    // This won't cause the warning since it's not in browser context
    console.debug('[GoTrueClient] Creating server-side instance (no warning risk)');
    return new GoTrueClient({
      ...options,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  }

  // MOST IMPORTANT: Check if we already have a shared instance
  if (window.__SHARED_GOTRUE__) {
    console.debug('[GoTrueClient] Using existing __SHARED_GOTRUE__ instance');
    return window.__SHARED_GOTRUE__;
  }
  
  // Second check for our own instance tracker
  if (window.__GO_TRUE_CLIENT__) {
    console.debug('[GoTrueClient] Using existing __GO_TRUE_CLIENT__ instance');
    return window.__GO_TRUE_CLIENT__;
  }

  // Honor prevention flag if set
  if (preventAutoRecreation && goTrueClientInstance) {
    console.debug('[GoTrueClient] Recreation prevented - returning existing instance');
    return goTrueClientInstance;
  }
  
  // For client side, ensure we only have one instance
  if (!goTrueClientInstance) {
    console.debug('[GoTrueClient] Creating singleton instance');
    
    // Ensure we have consistent auth options
    const finalOptions = {
      ...options,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: STORAGE_KEY,
    };
    
    try {
      goTrueClientInstance = new GoTrueClient(finalOptions);
      
      // Store in every possible location
      window.__GO_TRUE_CLIENT__ = goTrueClientInstance;
      window.__SHARED_GOTRUE__ = goTrueClientInstance;
      
      // Also store on the auth namespace if it exists
      if (window.supabase?.auth) {
        console.debug('[GoTrueClient] Attaching to supabase.auth namespace');
        window.supabase.auth.goTrueClient = goTrueClientInstance;
      }
      
      // Monkey patch the constructor to prevent multiple instances
      monkeyPatchGoTrueClient();
      
      return goTrueClientInstance;
    } catch (error) {
      console.error('[GoTrueClient] Error creating client:', error);
      
      // As a fallback, create a basic client
      goTrueClientInstance = new GoTrueClient({
        storageKey: STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
      });
      
      window.__GO_TRUE_CLIENT__ = goTrueClientInstance;
      window.__SHARED_GOTRUE__ = goTrueClientInstance;
      
      return goTrueClientInstance;
    }
  } else {
    console.debug('[GoTrueClient] Reusing existing instance');
  }
  
  return goTrueClientInstance;
}

/**
 * Directly patch the GoTrueClient constructor to intercept new instances
 */
function monkeyPatchGoTrueClient(): void {
  if (typeof window === 'undefined') return;
  
  const originalGoTrueClient = window.GoTrueClient;
  if (originalGoTrueClient) {
    console.debug('[GoTrueClient] Monkey patching GoTrueClient constructor');
    
    // @ts-ignore - We need to override the constructor
    window.GoTrueClient = function(...args: any[]) {
      console.debug('[GoTrueClient] Intercepted new GoTrueClient creation attempt - returning singleton');
      
      // If we already have an instance, use it
      if (window.__SHARED_GOTRUE__) {
        return window.__SHARED_GOTRUE__;
      }
      
      // If we have our own instance, use it
      if (goTrueClientInstance) {
        return goTrueClientInstance;
      }
      
      // If we have to create a new one, make sure it becomes the singleton
      const newInstance = new (originalGoTrueClient as any)(...args);
      goTrueClientInstance = newInstance;
      window.__SHARED_GOTRUE__ = newInstance;
      window.__GO_TRUE_CLIENT__ = newInstance;
      return newInstance;
    };
    
    // Copy over prototype and static properties
    if (originalGoTrueClient.prototype) {
      // @ts-ignore - We need to copy the prototype
      window.GoTrueClient.prototype = originalGoTrueClient.prototype;
    }
    
    // Add any static methods
    for (const key in originalGoTrueClient) {
      if (Object.prototype.hasOwnProperty.call(originalGoTrueClient, key)) {
        // @ts-ignore - We need to copy static properties
        window.GoTrueClient[key] = originalGoTrueClient[key];
      }
    }
  }
}

/**
 * Reset the GoTrueClient instance
 * Use this if you're having auth issues
 */
export function resetGoTrueClient(): void {
  if (typeof window === 'undefined') return;
  
  console.debug('[GoTrueClient] Resetting singleton instance');
  goTrueClientInstance = undefined;
  window.__GO_TRUE_CLIENT__ = undefined;
  window.__SHARED_GOTRUE__ = undefined;
  
  // Also remove from supabase.auth if it exists
  if (window.supabase?.auth?.goTrueClient) {
    delete window.supabase.auth.goTrueClient;
  }
  
  // Set prevention flag to avoid automatic recreation
  preventAutoRecreation = true;
  
  // Clear any supabase auth related localStorage items
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase.auth') || key.includes('gotrue') || key.includes('aicurator')) {
      console.debug(`[GoTrueClient] Removing storage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
}

/**
 * Forcibly prevent any further GoTrueClient instances from being created
 * This can help stop third-party libraries from creating their own instances
 */
export function lockGoTrueClient(): void {
  if (typeof window === 'undefined') return;
  
  console.debug('[GoTrueClient] Locking GoTrueClient to prevent further instances');
  
  // Set the prevention flag
  preventAutoRecreation = true;
  
  // Ensure the monkey patch is applied
  monkeyPatchGoTrueClient();
  
  // Also make sure we have an instance to use
  if (!goTrueClientInstance && !window.__SHARED_GOTRUE__) {
    console.debug('[GoTrueClient] Creating instance before locking');
    getGoTrueClient({
      storageKey: STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true
    });
  }
} 