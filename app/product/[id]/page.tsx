// This is a Server Component
import ProductClient from './product-client';
import { supabase } from '@/lib/supabase-client';

// Add static params for build time generation
export async function generateStaticParams() {
  try {
    // Get approved artworks to pre-generate - increased to cover more products
    const { data, error } = await supabase
      .from('artworks')
      .select('id')
      .eq('status', 'approved')
      .limit(100); // Increased from 20 to 100 to cover more products
    
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

// For static exports, we need to remove dynamic parameters
// and rely only on the pre-generated paths
export const dynamicParams = false; // Static exports require all paths to be pre-rendered at build time

// Server Component that passes data to Client Component
export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductClient productId={params.id} />;
}