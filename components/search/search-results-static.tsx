"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch on the client side
    if (!isClient) return;

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
  }, [query, category, isClient]);

  // Show loading state
  if (loading || !isClient) {
    return (
      <div className="space-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col md:flex-row gap-6 p-6 border rounded-lg">
            <div className="md:w-1/3 aspect-square bg-gray-200 rounded-lg" />
            <div className="md:w-2/3 space-y-4">
              <div className="h-7 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-9 bg-gray-200 rounded w-1/4 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4 text-lg">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <p className="text-gray-500 mb-6 text-lg">No products found matching your criteria.</p>
        <Button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-2"
        >
          Browse All Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {products.map((product) => {
        // Find primary image first, fall back to first image if no primary
        const primaryImage = product.images?.find(img => img.is_primary);
        const imageUrl = primaryImage?.url || product.images?.[0]?.url;
        
        return (
          <div 
            key={product.id}
            className="group cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex flex-col md:flex-row gap-8 p-6 border rounded-lg"
            onClick={() => window.location.href = `/product/${product.id}`}
          >
            <div className="md:w-1/3 relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {imageUrl ? (
                <SupabaseImage
                  src={imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>
            <div className="md:w-2/3 flex flex-col">
              <h3 className="font-serif text-2xl mb-2">{product.title}</h3>
              <p className="text-gray-600 mb-2">By: {product.artist_name}</p>
              {product.category && (
                <p className="text-blue-600 mb-2 capitalize">Category: {product.category}</p>
              )}
              <p className="text-green-600 font-bold text-lg mb-4">£{product.price?.toLocaleString()}</p>
              
              <p className="text-gray-700 mb-6 line-clamp-3">
                {product.description || "No description available for this artwork."}
              </p>
              
              <div className="mt-auto">
                <Button className="group-hover:bg-primary/90 transition-colors duration-200">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 