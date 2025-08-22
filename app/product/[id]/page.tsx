// This is a Server Component
import ProductClient from './product-client';
import { supabase } from '@/lib/supabase-client';

// Add static params for build time generation
export async function generateStaticParams() {
  try {
    // Check if supabase client is properly initialized
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn('Supabase client not available during static generation, using fallback');
      return [{ id: 'placeholder' }];
    }

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

// Enable dynamic params so new products can be rendered on-demand
export const dynamicParams = true; // Allow dynamic generation for new products

// Server Component that passes data to Client Component
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductClient productId={id} />;
}