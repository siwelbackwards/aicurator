import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This is needed for Next.js export mode
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Parse the query parameters
    const url = new URL(request.url);
    const tableName = url.searchParams.get('table') || 'profiles';
    
    // Create a Supabase client with correct cookies parameter
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    // Get table schema information via system tables
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
      
    if (error) {
      console.error(`Error inspecting schema for ${tableName}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return the schema information
    return NextResponse.json({ 
      table: tableName,
      columns: data 
    });
  } catch (error) {
    console.error('Error in schema debug endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 