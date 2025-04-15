'use client';

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase';

/**
 * Custom hook to provide a singleton Supabase client
 * Ensures only one instance is created and used throughout the application
 * @param adminAccess Whether to use the admin client with elevated privileges
 * @returns The Supabase client instance
 */
export function useSupabaseClient(adminAccess: boolean = false): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  
  useEffect(() => {
    async function getClient() {
      try {
        const client = adminAccess 
          ? await SupabaseService.getAdminClient()
          : await SupabaseService.getClient();
        
        setClient(client);
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
        setClient(null);
      }
    }
    
    getClient();
  }, [adminAccess]);
  
  return client;
}

/**
 * Custom hook to provide a singleton Supabase admin client
 * Convenience wrapper around useSupabaseClient with adminAccess=true
 * @returns The Supabase admin client instance
 */
export function useSupabaseAdminClient(): SupabaseClient | null {
  return useSupabaseClient(true);
} 