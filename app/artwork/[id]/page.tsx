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
      .limit(10);
    
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

// Server Component that passes data to Client Component
export default function ArtworkPage({ params }: { params: { id: string } }) {
  // Since we're using static export, we'll need to handle this differently
  return <ArtworkDetailClient artworkId={params.id} />;
} 