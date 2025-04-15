'use client';

import { useEffect } from 'react';
import { resetSupabaseClients } from '@/lib/supabase';
import { resetGoTrueClient, lockGoTrueClient } from '@/lib/gotrue-singleton';
import { SupabaseClient } from '@supabase/supabase-js';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    __RESET_GOTRUE__?: () => void;
    __SHARED_GOTRUE__?: any;
    __SUPABASE_CLIENT__?: SupabaseClient;
    __SUPABASE_ADMIN__?: SupabaseClient;
    GoTrueClient?: any;
  }
}

/**
 * Component to ensure clean Supabase initialization
 * Place this at the top level of your application in layout.tsx
 */
export function SupabaseInitializer() {
  useEffect(() => {
    // Only run once on initial client load
    if (typeof window !== 'undefined') {
      const hasReset = sessionStorage.getItem('supabase_reset');
      
      // Always reset on every page load in development to prevent issues
      const isDev = process.env.NODE_ENV !== 'production';
      const shouldForceReset = isDev;
      
      if (!hasReset || shouldForceReset) {
        // Wait for the page to fully load first
        const timer = setTimeout(() => {
          console.debug('[SupabaseInitializer] Performing client reset');
          
          // First check if we need to use the manual reset function from patch
          if (window.__RESET_GOTRUE__) {
            console.debug('[SupabaseInitializer] Using patched reset function');
            window.__RESET_GOTRUE__();
          }
          
          // Next reset GoTrueClient
          resetGoTrueClient();
          
          // Then reset Supabase clients
          resetSupabaseClients();
          
          // After a short delay, lock the GoTrueClient to prevent any more instances
          setTimeout(() => {
            lockGoTrueClient();
            console.debug('[SupabaseInitializer] GoTrueClient locked to prevent further instances');
            
            // Check if we need to force client recreation
            if (
              !window.__SUPABASE_CLIENT__ || 
              !window.__SHARED_GOTRUE__ ||
              !window.GoTrueClient
            ) {
              console.debug('[SupabaseInitializer] Forcing client recreation');
              // Force client reload by triggering imports
              const { supabase, supabaseAdmin } = require('@/lib/supabase');
              
              // Store references on window
              window.__SUPABASE_CLIENT__ = supabase;
              window.__SUPABASE_ADMIN__ = supabaseAdmin;
            }
            
            sessionStorage.setItem('supabase_reset', 'true');
            console.debug('[SupabaseInitializer] Reset complete');
          }, 100);
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        console.debug('[SupabaseInitializer] Clients already reset in this session');
        // Even if already reset, make sure GoTrueClient is locked
        lockGoTrueClient();
        
        // Also check if window clients are missing (React fast refresh might have cleared them)
        if (!window.__SUPABASE_CLIENT__) {
          console.debug('[SupabaseInitializer] Recreating missing global clients');
          const { supabase, supabaseAdmin } = require('@/lib/supabase');
          window.__SUPABASE_CLIENT__ = supabase;
          window.__SUPABASE_ADMIN__ = supabaseAdmin;
        }
      }
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 