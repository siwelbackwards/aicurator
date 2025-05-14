import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Mark this route as static for Next.js static export
export const dynamic = 'force-static';

// Staticize this route for export
export async function GET() {
  // For static export, we return empty data
  // When deployed, this will be handled by Netlify functions
  return NextResponse.json([]);
} 