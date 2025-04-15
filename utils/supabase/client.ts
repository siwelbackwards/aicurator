"use client";

import { createBrowserClient } from "@supabase/ssr";

// Keep a reference to the client to prevent multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient> | undefined = undefined;

export const createClient = () => {
  // Return existing client if available
  if (typeof window !== 'undefined' && supabaseClient) {
    return supabaseClient;
  }
  
  // Create new client if not available
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return supabaseClient;
}; 