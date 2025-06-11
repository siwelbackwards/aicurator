"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { withSupabaseRetry } from '@/lib/with-auth-retry';
import { formatPrice } from '@/lib/currency-utils';
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
  currency?: string;
  images: ArtworkImage[];
  description?: string;
  category?: string;
  location?: string;
  materials?: string;
  provenance?: string;
  year?: number;
  width?: number;
  height?: number;
  depth?: number;
  measurement_unit?: string;
  status: string;
  created_at: string;
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
        
        // Use the retry wrapper for reliable data fetching
        const { data: artworks, error } = await withSupabaseRetry(
          () => {
            let supabaseQuery = supabase
              .from('artworks')
              .select(`
                id,
                title,
                artist_name,
                price,
                currency,
                category,
                description,
                materials,
                location,
                provenance,
                width,
                height,
                depth,
                measurement_unit,
                year,
                images:artwork_images(file_path, is_primary)
              `)
              .eq('status', 'approved');
            
            // Apply comprehensive search filters if provided
            if (query && query.trim()) {
              // Search across all relevant text fields
              const searchTerm = query.trim();
              supabaseQuery = supabaseQuery.or(
                `title.ilike.%${searchTerm}%,` +
                `artist_name.ilike.%${searchTerm}%,` +
                `description.ilike.%${searchTerm}%,` +
                `materials.ilike.%${searchTerm}%,` +
                `location.ilike.%${searchTerm}%,` +
                `provenance.ilike.%${searchTerm}%,` +
                `category.ilike.%${searchTerm}%`
              );
            }
            
            // Apply category filter if provided
            if (category && category !== 'all') {
              supabaseQuery = supabaseQuery.eq('category', category);
            }

            // Order by relevance and recency
            supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

            return supabaseQuery;
          },
          'Search artworks with comprehensive filters'
        );

        if (error) {
          console.error('Error fetching artworks:', error);
          setError('Failed to fetch products. Please try again.');
          return;
        }

        if (artworks) {
          // Get public URLs for all images
          const artworksWithUrls = (artworks as any[]).map((artwork: any) => ({
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

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

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
        <p className="text-gray-500 mb-6 text-lg">
          {query 
            ? `No artworks found matching "${query}"${category !== 'all' ? ` in ${category}` : ''}.`
            : `No artworks found${category !== 'all' ? ` in ${category}` : ''}.`
          }
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Search suggestions:</p>
          <p className="text-xs text-gray-400">
            Try searching for artist names, artwork titles, materials, locations, or descriptions
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-2 mt-4"
        >
          Browse All Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Results Header */}
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <p className="text-lg font-medium text-gray-900">
            {products.length} {products.length === 1 ? 'artwork' : 'artworks'} found
          </p>
          {query && (
            <p className="text-sm text-gray-600">
              Searching across titles, artists, descriptions, materials, locations, and more
            </p>
          )}
        </div>
        <div className="text-xs text-gray-400">
          Sorted by most recent
        </div>
      </div>

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
              <h3 className="font-serif text-2xl mb-2">
                {highlightSearchTerm(product.title, query || '')}
              </h3>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Artist:</span> {highlightSearchTerm(product.artist_name, query || '')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm">
                {product.category && (
                  <p className="text-blue-600 capitalize">
                    <span className="font-medium">Category:</span> {highlightSearchTerm(product.category, query || '')}
                  </p>
                )}
                {product.year && (
                  <p className="text-gray-600">
                    <span className="font-medium">Year:</span> {product.year}
                  </p>
                )}
                {product.materials && (
                  <p className="text-gray-600">
                    <span className="font-medium">Materials:</span> {highlightSearchTerm(product.materials, query || '')}
                  </p>
                )}
                {product.location && (
                  <p className="text-gray-600">
                    <span className="font-medium">Location:</span> {highlightSearchTerm(product.location, query || '')}
                  </p>
                )}
                {(product.width || product.height) && (
                  <p className="text-gray-600">
                    <span className="font-medium">Dimensions:</span> {' '}
                    {product.width && product.height 
                      ? `${product.width} × ${product.height}${product.depth ? ` × ${product.depth}` : ''} ${product.measurement_unit || 'cm'}`
                      : product.width 
                        ? `${product.width} ${product.measurement_unit || 'cm'} (width)`
                        : `${product.height} ${product.measurement_unit || 'cm'} (height)`
                    }
                  </p>
                )}
                {product.provenance && (
                  <p className="text-gray-600 md:col-span-2">
                    <span className="font-medium">Provenance:</span> {highlightSearchTerm(product.provenance, query || '')}
                  </p>
                )}
              </div>
              
              <p className="text-green-600 font-bold text-lg mb-4">{formatPrice(product.price || 0, product.currency)}</p>
              
              <p className="text-gray-700 mb-6 line-clamp-3">
                {product.description 
                  ? highlightSearchTerm(product.description, query || '') 
                  : "No description available for this artwork."
                }
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