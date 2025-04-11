// This is a Server Component
import ProductClient from './product-client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

// Add static params for build time generation
export async function generateStaticParams() {
  try {
    // For static export, we'll generate a dummy ID
    // The actual data fetching happens client-side
    return [{ id: 'placeholder' }];
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