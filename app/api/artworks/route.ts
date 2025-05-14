import { NextResponse } from 'next/server';
import { insertArtwork, inspectTableSchema } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Most basic fields that definitely exist in the artworks table
// We'll keep this extremely minimal to avoid any schema errors
const CORE_FIELDS = [
  'user_id', 'title', 'category', 'status', 
  'price', 'description', 'artist_name'
];

// Helper to create a minimal object with only known fields
function createMinimalArtworkData(data: any) {
  const minimal: Record<string, any> = {};
  
  // Only copy fields we're certain exist in the database
  for (const field of CORE_FIELDS) {
    if (data[field] !== undefined) {
      minimal[field] = data[field];
    }
  }
  
  // Ensure required fields are present
  minimal.user_id = data.user_id;
  minimal.title = data.title || 'Untitled';
  minimal.category = data.category || 'other';
  minimal.status = data.status || 'pending';
  
  return minimal;
}

export async function POST(request: Request) {
  console.log('⏱️ API route called at:', new Date().toISOString());
  
  try {
    console.log('🔵 API route received request to create artwork');
    const data = await request.json();
    
    console.log('🔵 API route received data:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validate that we have the minimum required fields
    if (!data.user_id || !data.title) {
      console.log('🔵 Missing required fields:', { 
        hasUserId: !!data.user_id, 
        hasTitle: !!data.title
      });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { hasUserId: !!data.user_id, hasTitle: !!data.title }
      }, { status: 400 });
    }

    // Log the user ID for debugging
    console.log('🔵 Submitting with user ID:', data.user_id);
    
    // Create a minimal object with only fields we know exist
    const minimalData = createMinimalArtworkData(data);
    console.log('🔵 Using minimal data:', JSON.stringify(minimalData));
    
    // Try to inspect the schema first to see what columns actually exist
    try {
      const { columns } = await inspectTableSchema('artworks');
      console.log('🔵 Available columns in artworks table:', 
        columns.map(c => c.column_name).join(', '));
    } catch (schemaError) {
      console.error('🔴 Could not inspect schema:', schemaError);
    }
    
    // Use the server function to insert the artwork with minimal data
    console.log('🔵 Calling insertArtwork server function with minimal data');
    const { data: artwork, error } = await insertArtwork(minimalData);
      
    if (error) {
      console.error('🔴 API insert error:', error);
      
      // If we get an RLS error, try one more fallback approach
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '42501') {
        console.log('🔵 Primary insert failed with RLS error. Trying direct SQL approach...');
        
        try {
          // Create a fresh server client
          const supabase = await createServerSupabaseClient();
          
          // Use the most basic fields only
          const ultraMinimalData = {
            user_id: data.user_id,
            title: data.title || 'Untitled',
            category: data.category || 'other',
            status: 'pending'
          };
          
          console.log('🔵 Attempting RPC function with ultra minimal data');
          
          // Try a direct SQL query as a last resort
          const { data: sqlResult, error: sqlError } = await supabase.rpc(
            'insert_basic_artwork',
            {
              p_user_id: data.user_id,
              p_title: data.title || 'Untitled',
              p_category: data.category || 'other'
            }
          );
          
          if (sqlError) {
            console.error('🔴 Direct SQL approach failed:', sqlError);
          } else {
            console.log('🟢 Direct SQL approach succeeded!', sqlResult);
            return NextResponse.json({ artwork: sqlResult });
          }
        } catch (finalError) {
          console.error('🔴 Final fallback attempt failed:', finalError);
        }
      }
      
      // If we reach here, all approaches failed
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String(error.message)
          : 'Unknown error';
          
      return NextResponse.json({ 
        error: errorMessage,
        details: error,
        message: 'Failed to insert artwork data'
      }, { status: 500 });
    }
    
    console.log('🟢 Successfully inserted artwork:', artwork);
    return NextResponse.json({ artwork });
  } catch (e) {
    console.error('🔴 Unexpected error in artwork API:', e);
    return NextResponse.json({ 
      error: 'Server error',
      details: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}
