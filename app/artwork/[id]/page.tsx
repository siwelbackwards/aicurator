// This is a Server Component
import ArtworkDetailClient from './artwork-client';
import { supabase } from "@/lib/supabase-client";

// Add static params for build time generation
export async function generateStaticParams() {
  try {
    // Get a few approved artworks to pre-generate
    const { data, error } = await supabase
      .from('artworks')
      .select('id')
      .eq('status', 'approved')
      .limit(100); // Increased to match product page
    
    if (error || !data) {
      console.error('Error generating static params:', error);
      return [{ id: 'placeholder' }];
    }
    
    const params = data.map((artwork: { id: string }) => ({ id: artwork.id }));
    
    // Always include placeholder for fallback
    return [...params, { id: 'placeholder' }];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{ id: 'placeholder' }];
  }
}

// Enable dynamic params so new artworks can be rendered on-demand
export const dynamicParams = true; // Allow dynamic generation for new artworks

// Server Component that passes data to Client Component
export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArtworkDetailClient artworkId={id} />;
} 