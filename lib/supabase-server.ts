'use server';

import { createClient } from '@supabase/supabase-js';

// Set environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This file is used only on the server, so we can safely initialize the admin client
export const createServerSupabaseClient = async () => {
  // Verify we have a service key
  if (!supabaseServiceKey) {
    console.warn('🚨 Missing SUPABASE_SERVICE_ROLE_KEY - admin operations may fail');
  }
  
  console.log('🔵 Creating server Supabase client');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Helper to inspect the database schema
export async function inspectTableSchema(tableName: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get table schema information via system tables
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
      
    if (error) {
      console.error(`🔴 Error inspecting schema for ${tableName}:`, error);
      return { columns: [], error };
    }
    
    console.log(`🟢 Schema for ${tableName}:`, data);
    return { columns: data || [], error: null };
  } catch (e) {
    console.error(`🔴 Exception inspecting schema:`, e);
    return { columns: [], error: e };
  }
}

// Server-only function to insert artwork data
export async function insertArtwork(artworkData: any) {
  console.log('🔵 Starting insertArtwork function');
  const supabase = await createServerSupabaseClient();
  
  try {
    console.log('🔵 Server inserting artwork data:', JSON.stringify(artworkData).substring(0, 200) + '...');
    console.log('🔵 Using service role key:', supabaseServiceKey ? 'Available (length: ' + supabaseServiceKey.length + ')' : 'Missing');
    
    // Check for required fields before attempting insert
    if (!artworkData.user_id) {
      console.error('🔴 Missing user_id in artwork data');
      return { 
        error: { message: 'Missing user_id in artwork data', code: 'MISSING_USER_ID' },
        data: null 
      };
    }

    // First try a direct database check to see if we can connect at all
    console.log('🔵 Testing database connection with count query');
    try {
      const { count, error: countError } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('🔴 Database connection test failed:', countError);
      } else {
        console.log('🟢 Database connection successful, artworks count:', count);
      }
    } catch (testError) {
      console.error('🔴 Database test query exception:', testError);
    }
    
    // Ensure we're only using the most basic fields - extremely minimal approach
    // Use a record type with index signature to allow adding fields dynamically
    const basicData: Record<string, any> = {
      user_id: artworkData.user_id,
      title: artworkData.title || 'Untitled',
      category: artworkData.category || 'other',
      status: artworkData.status || 'pending'
    };
    
    // Only add optional fields if they were provided
    if (artworkData.price !== undefined) basicData.price = artworkData.price;
    if (artworkData.description !== undefined) basicData.description = artworkData.description;
    if (artworkData.artist_name !== undefined) basicData.artist_name = artworkData.artist_name;
    
    console.log('🔵 Using basic data with only essential fields:', JSON.stringify(basicData));
    
    // Insert artwork with minimal data
    console.log('🔵 Attempting to insert with service role client');
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('artworks')
      .insert(basicData)
      .select()
      .single();
    console.log(`🔵 Insert operation took ${Date.now() - startTime}ms to complete`);
      
    if (error) {
      console.error('🔴 Server artwork insert error:', error);
      
      // Try a simpler version for debugging
      if (error.code === '42501') {
        console.log('🔵 Attempting fallback with minimal data due to RLS error');
        
        // Try with absolute minimal required fields
        const minimalData = {
          user_id: artworkData.user_id,
          title: artworkData.title || 'Untitled',
          category: artworkData.category || 'other',
          status: 'pending'
        };
        
        console.log('🔵 Using absolute minimal data:', minimalData);
        
        // Try direct SQL query using rpc
        try {
          console.log('🔵 Attempting to use SQL RPC function for insert');
          
          // Try to execute stored function
          const functionStart = Date.now();
          const { data: sqlResult, error: sqlError } = await supabase.rpc('insert_basic_artwork', {
            p_user_id: artworkData.user_id,
            p_title: artworkData.title || 'Untitled',
            p_category: artworkData.category || 'other'
          });
          console.log(`🔵 SQL function took ${Date.now() - functionStart}ms to complete`);
          
          if (sqlError) {
            console.error('🔴 SQL function failed:', sqlError);
          } else {
            console.log('🟢 SQL function succeeded!', sqlResult);
            return { error: null, data: sqlResult };
          }
        } catch (sqlException) {
          console.error('🔴 SQL function exception:', sqlException);
        }
        
        // If RPC fails, try direct minimal insert
        console.log('🔵 Attempting direct minimal insert as last resort');
        const { data: minimalResult, error: minimalError } = await supabase
          .from('artworks')
          .insert(minimalData)
          .select()
          .single();
          
        if (minimalError) {
          console.error('🔴 Even minimal insert failed:', minimalError);
          return { error: minimalError, data: null };
        } else {
          console.log('🟢 Minimal insert succeeded!', minimalResult);
          return { error: null, data: minimalResult };
        }
      }
      
      return { error, data: null };
    }
    
    console.log('🟢 Artwork insert successful:', data);
    return { error: null, data };
  } catch (e) {
    console.error('🔴 Server unexpected error:', e);
    return { error: e, data: null };
  }
} 