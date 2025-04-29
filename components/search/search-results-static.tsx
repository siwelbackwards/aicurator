"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { formatSupabaseUrl } from '@/lib/utils';
import { SupabaseImage } from '@/components/ui/supabase-image';

interface ArtworkImage {
  file_path: string;
  is_primary: boolean;
  url?: string;
}

interface Product {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  images: ArtworkImage[];
  description?: string;
  category?: string;
}

export default function SearchResultsStatic({ query, category }: { query?: string; category?: string }) {
  // Check if we're on the server for static generation
  const isServer = typeof window === 'undefined';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!isServer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip data fetching during static build
    if (isServer) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let supabaseQuery = supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(file_path, is_primary)
          `)
          .eq('status', 'approved');
        
        // Apply search filters if provided
        if (query) {
          supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
        }
        
        if (category && category !== 'all') {
          supabaseQuery = supabaseQuery.eq('category', category);
        }

        const { data: artworks, error } = await supabaseQuery;

        if (error) {
          console.error('Error fetching artworks:', error);
          setError('Failed to fetch products. Please try again.');
          return;
        }

        if (artworks) {
          // Get public URLs for all images
          const artworksWithUrls = artworks.map((artwork: any) => ({
            ...artwork,
            images: artwork.images?.map((image: ArtworkImage) => ({
              ...image,
              url: image.file_path
            }))
          }));
          
          setProducts(artworksWithUrls);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, category, isServer]);

  // During static build, return an empty state
  if (isServer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Loading search results...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
        <Button onClick={() => window.location.href = '/'}>Browse All Products</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const imageUrl = product.images?.[0]?.url;
        
        return (
          <div 
            key={product.id}
            className="group cursor-pointer"
            onClick={() => window.location.href = `/product/${product.id}`}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              {imageUrl ? (
                <SupabaseImage
                  src={imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>
            <h3 className="font-medium text-lg mt-2">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-1">By: {product.artist_name}</p>
            <p className="text-green-600 font-bold">£{product.price?.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
} 