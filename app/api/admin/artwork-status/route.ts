import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    console.log('⭐ Status API: Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Parse the request body
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`⭐ Status API: Updating artwork ${id} to status "${status}"`);
    
    // Use server-side client directly without user authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('⭐ Status API: Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update the artwork status with admin privileges
    const { data, error } = await supabase
      .from('artworks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`⭐ Status API: Error updating artwork ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`⭐ Status API: Successfully updated artwork ${id} status to "${status}"`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('⭐ Status API: Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 