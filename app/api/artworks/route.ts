import { NextRequest, NextResponse } from 'next/server';
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

// Mark this route as static for Next.js static export
export const dynamic = 'force-static';

// Staticize the API endpoints to make it compatible with static export
export async function GET() {
  return NextResponse.json({ message: 'Static export placeholder' });
}

export async function POST() {
  return NextResponse.json({ success: true, id: 'static-export-placeholder' });
}
