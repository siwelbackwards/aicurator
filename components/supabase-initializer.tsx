'use client';

import { useEffect } from 'react';
import { resetSupabaseClients } from '@/lib/supabase';
import { resetGoTrueClient, lockGoTrueClient } from '@/lib/gotrue-singleton';

/**
 * Component to ensure clean Supabase initialization
 * Place this at the top level of your application in layout.tsx
 */
export function SupabaseInitializer() {
  useEffect(() => {
    // Only run once on initial client load
    if (typeof window !== 'undefined') {
      const hasReset = sessionStorage.getItem('supabase_reset');
      
      if (!hasReset) {
        // Wait for the page to fully load first
        const timer = setTimeout(() => {
          console.debug('[SupabaseInitializer] Performing one-time client reset');
          
          // Reset GoTrueClient first
          resetGoTrueClient();
          
          // Then reset Supabase clients
          resetSupabaseClients();
          
          // After a short delay, lock the GoTrueClient to prevent any more instances
          setTimeout(() => {
            lockGoTrueClient();
            console.debug('[SupabaseInitializer] GoTrueClient locked to prevent further instances');
          }, 100);
          
          sessionStorage.setItem('supabase_reset', 'true');
          console.debug('[SupabaseInitializer] Reset complete');
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        console.debug('[SupabaseInitializer] Clients already reset in this session');
        // Even if already reset, make sure GoTrueClient is locked
        lockGoTrueClient();
      }
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 