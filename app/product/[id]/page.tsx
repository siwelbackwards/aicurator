// This is a Server Component
import ProductClient from './product-client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Remove the generateStaticParams function since we're using dynamic routes with export
// Instead, make this a client component to handle dynamic data fetching

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server Component that passes data to Client Component
export default async function ProductPage({ params }: { params: { id: string } }) {
  // Since we're using static export, we'll need to handle this differently
  return <ProductClient productId={params.id} />;
}