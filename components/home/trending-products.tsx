"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { formatSupabaseUrl } from '@/lib/utils';

// Add a function to get a valid image URL
const getValidImageUrl = (image: any) => {
  if (!image) return 'https://source.unsplash.com/random/800x800/?art';
  
  // If we have a valid URL, use it
  if (image.url && image.url.includes('http')) {
    return image.url;
  }
  
  // If we have a file_path, construct a URL using the utility function
  if (image.file_path && image.file_path.length > 3) {
    // Enhanced logging to debug paths
    if (process.env.NODE_ENV === 'development') {
      console.log(`Processing file_path for image URL: "${image.file_path}"`);
    }
    
    // Just pass the file_path directly to formatSupabaseUrl which will handle paths correctly
    return formatSupabaseUrl(image.file_path);
  }
  
  // Fallback
  return 'https://source.unsplash.com/random/800x800/?art';
};

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
}

const VISIBLE_ITEMS = 4;
const MAX_RETRY_ATTEMPTS = 3;

// Placeholder data for server-side rendering
const PLACEHOLDER_PRODUCTS: Product[] = Array(4).fill(null).map((_, i) => ({
  id: `placeholder-${i}`,
  title: 'Loading...',
  artist_name: 'Loading...',
  price: 0,
  images: []
}));

export default function TrendingProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Set isClient flag to avoid hydration mismatch
    setIsClient(true);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      // Check for Supabase client initialization
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        setHasError(true);
        return;
      }

      console.log('Fetching trending products...');
      
      const { data: artworks, error } = await supabase
        .from('artworks')
        .select(`
          *,
          images:artwork_images(file_path, is_primary)
        `)
        .eq('status', 'approved')
        .order('price', { ascending: false })
        .limit(12);

      // Check for error with improved handling
      if (error) {
        console.error('Error fetching artworks:', error.message);
        // Retry logic
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          setRetryCount(prev => prev + 1);
          console.log(`Retrying fetch (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
          setTimeout(() => fetchProducts(), 1000); // Retry after 1 second
          return;
        }
        setHasError(true);
        setLoading(false);
        return;
      }

      // Reset retry count on success
      setRetryCount(0);

      // Check if we received artworks data
      if (!artworks || artworks.length === 0) {
        console.log('No approved artworks found or empty response');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log(`Fetched ${artworks.length} trending products`);

      // Get public URLs for all images
      const artworksWithUrls = artworks.map((artwork: any) => ({
        ...artwork,
        // Ensure images is always an array, even if null or undefined
        images: artwork.images ? artwork.images.map((image: ArtworkImage) => {
          // Enhanced logging for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`Processing image for artwork ${artwork.id}:`, image.file_path);
          }
          
          return {
            ...image,
            // Don't create a URL here, just use the file_path as is
            url: image.file_path
          };
        }) : []
      }));
      
      setProducts(artworksWithUrls);
      setLoading(false);
    } catch (error: any) {
      console.error('Error in trending products:', error);
      // Retry logic for unexpected errors
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying after error (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
        setTimeout(() => fetchProducts(), 2000); // Retry after 2 seconds
        return;
      }
      setHasError(true);
      setLoading(false);
    }
  }, [retryCount]); // Keep retryCount here but not in the main useEffect

  useEffect(() => {
    // Only fetch data on the client side and only once when component mounts
    if (!isClient) return;
    
    fetchProducts();
  }, [isClient]); // Remove retryCount from here to prevent infinite loops

  const handleProductClick = (id: string) => {
    if (id.startsWith('placeholder-')) return;
    router.push(`/product/${id}`);
  };

  const slideNext = () => {
    if (isAnimating || startIndex >= products.length - VISIBLE_ITEMS) return;
    setIsAnimating(true);
    setStartIndex(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const slidePrevious = () => {
    if (isAnimating || startIndex <= 0) return;
    setIsAnimating(true);
    setStartIndex(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Use placeholder data for server rendering to avoid hydration issues
  const displayProducts = isClient ? 
    (products.length > 0 ? 
      products.slice(
    Math.max(0, startIndex),
    Math.min(startIndex + VISIBLE_ITEMS, products.length)
      ) : 
      []
    ) : 
    PLACEHOLDER_PRODUCTS;

  // Show loading state or error message
  if (!isClient || loading) {
    return (
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-serif">Trending Products</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show error message
  if (hasError) {
    return (
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-serif">Trending Products</h2>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800">
              Unable to load trending products. Please try again later.
            </p>
            <Button 
              onClick={() => {
                setHasError(false);
                setLoading(true);
                setRetryCount(0);
              }}
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Show empty state
  if (displayProducts.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-serif">Trending Products</h2>
          </div>
          <div className="p-8 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500">No trending products available at this time.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-serif">Trending Products</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={slidePrevious}
              disabled={startIndex === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={slideNext}
              disabled={startIndex >= products.length - VISIBLE_ITEMS}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => {
            // Find primary image first, fall back to first image if no primary
            const primaryImage = product.images?.find(img => img.is_primary);
            const firstImage = product.images?.[0];
            const imageUrl = getValidImageUrl(primaryImage || firstImage);

            return (
              <div 
                key={product.id} 
                className="group cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  {imageUrl ? (
                    <SupabaseImage
                      src={imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={false}
                      timeout={3000} // Add 3 second timeout for image loading
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-lg mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-2">By: {product.artist_name}</p>
                <p className="text-green-600 font-bold">
                  {product.price > 0 ? `£${product.price.toLocaleString()}` : '-'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}