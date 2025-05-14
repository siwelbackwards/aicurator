import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { images } = data;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'No images provided or invalid format',
      }, { status: 400 });
    }
    
    console.log('API route received images data:', JSON.stringify(images));
    
    // Create server-side Supabase client - make sure to await it since it's now async
    const supabase = await createServerSupabaseClient();
    
    // Insert all images
    const { data: result, error } = await supabase
      .from('artwork_images')
      .insert(images);
      
    if (error) {
      console.error('Error inserting images:', error);
      return NextResponse.json({ 
        error: typeof error === 'object' && error !== null && 'message' in error 
          ? error.message 
          : 'Unknown error',
        details: error,
        message: 'Failed to insert artwork images'
      }, { status: 500 });
    }
    
    console.log('Successfully linked images to artwork');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Unexpected error in artwork-images API:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 