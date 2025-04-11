// This is a Server Component
import ProductClient from './product-client';
import { supabase } from '@/lib/supabase';

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
    
    const params = data.map(artwork => ({ id: artwork.id }));
    
    // Always include placeholder for fallback
    return [...params, { id: 'placeholder' }];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{ id: 'placeholder' }];
  }
}

// Server Component that passes data to Client Component
export default function ProductPage({ params }: { params: { id: string } }) {
  // Since we're using static export, we'll need to handle this differently
  return <ProductClient productId={params.id} />;
}