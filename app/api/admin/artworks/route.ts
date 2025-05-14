import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    console.log('⭐ Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Use server-side client directly without user authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('⭐ Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('⭐ Admin API: Fetching all artworks with service role');
    
    // Fetch all artworks directly with admin privileges
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('⭐ Admin API error fetching artworks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`⭐ Admin API: Found ${data?.length || 0} artworks`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('⭐ Admin API unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 