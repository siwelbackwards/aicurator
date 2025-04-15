"use client";

import { GoTrueClient } from '@supabase/supabase-js';

// Global singleton for GoTrueClient
let goTrueClientInstance: GoTrueClient | undefined;

// Add a flag to prevent automatic recreation after reset
let preventAutoRecreation = false;

/**
 * Ensure only one GoTrueClient instance exists in the application
 * This is a direct workaround for the "Multiple GoTrueClient instances" warning
 */
export function getGoTrueClient(options?: any): GoTrueClient {
  if (typeof window === 'undefined') {
    // For server side, we create a new instance each time
    // This won't cause the warning since it's not in browser context
    return new GoTrueClient(options);
  }

  // Check if we already have a shared instance
  if ((window as any).__SHARED_GOTRUE__) {
    console.debug('[GoTrueClient] Using global __SHARED_GOTRUE__ instance');
    return (window as any).__SHARED_GOTRUE__;
  }

  // Honor prevention flag if set
  if (preventAutoRecreation) {
    console.debug('[GoTrueClient] Recreation prevented - returning existing instance');
    // If we have a stored instance, return it. Otherwise create a new one anyway.
    if ((window as any).__GO_TRUE_CLIENT__) {
      return (window as any).__GO_TRUE_CLIENT__;
    }
  }
  
  // For client side, ensure we only have one instance
  if (!goTrueClientInstance) {
    console.debug('[GoTrueClient] Creating singleton instance with options:', options);
    goTrueClientInstance = new GoTrueClient(options);
    
    // Store in global scope for cross-module reference
    if (window) {
      (window as any).__GO_TRUE_CLIENT__ = goTrueClientInstance;
      (window as any).__SHARED_GOTRUE__ = goTrueClientInstance;
      
      // Monkey patch the constructor to prevent multiple instances
      monkeyPatchGoTrueClient();
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
  
  const originalGoTrueClient = (window as any).GoTrueClient;
  if (originalGoTrueClient) {
    console.debug('[GoTrueClient] Monkey patching GoTrueClient constructor');
    (window as any).GoTrueClient = function() {
      console.debug('[GoTrueClient] Intercepted new GoTrueClient creation attempt - returning singleton');
      return (window as any).__SHARED_GOTRUE__ || goTrueClientInstance;
    };
    // Copy over prototype and static properties
    if (originalGoTrueClient.prototype) {
      (window as any).GoTrueClient.prototype = originalGoTrueClient.prototype;
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
  (window as any).__GO_TRUE_CLIENT__ = undefined;
  (window as any).__SHARED_GOTRUE__ = undefined;
  
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
} 