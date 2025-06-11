"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataContext } from '@/lib/data-context';
import Image from 'next/image';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { formatPrice } from '@/lib/currency-utils';
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
  currency?: string;
  images: ArtworkImage[];
}

const VISIBLE_ITEMS = 4;

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
  const { trendingProducts, isLoading, error, refreshTrendingProducts } = useDataContext();
  const [startIndex, setStartIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient flag to avoid hydration mismatch
    setIsClient(true);
  }, []);

  // Refresh data when component mounts if no data available
  useEffect(() => {
    if (isClient && trendingProducts.length === 0 && !isLoading) {
      refreshTrendingProducts();
    }
  }, [isClient, trendingProducts.length, isLoading, refreshTrendingProducts]);

  const handleProductClick = (id: string) => {
    if (id.startsWith('placeholder-')) return;
    router.push(`/product/${id}`);
  };

  const slideNext = () => {
    if (isAnimating || startIndex >= trendingProducts.length - VISIBLE_ITEMS) return;
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
    (trendingProducts.length > 0 ? 
      trendingProducts.slice(
        Math.max(0, startIndex),
        Math.min(startIndex + VISIBLE_ITEMS, trendingProducts.length)
      ) : 
      []
    ) : 
    PLACEHOLDER_PRODUCTS;

  // Show loading state or error message
  if (!isClient || (isLoading && trendingProducts.length === 0)) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trending Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLACEHOLDER_PRODUCTS.map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Trending Products</h2>
          <p className="text-red-600 mb-4">Failed to load trending products</p>
          <Button onClick={refreshTrendingProducts} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Trending Products</h2>
          <p className="text-gray-600">No trending products available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold">Trending Products</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={slidePrevious}
              disabled={startIndex <= 0 || isAnimating}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={slideNext}
              disabled={startIndex >= trendingProducts.length - VISIBLE_ITEMS || isAnimating}
              className="rounded-full"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => {
            const primaryImage = product.images?.find((img: ArtworkImage) => img.is_primary) || product.images?.[0];
            const imageUrl = getValidImageUrl(primaryImage);
            
            return (
              <div
                key={product.id}
                className={`group cursor-pointer transition-all duration-500 ${isAnimating ? 'transform' : ''}`}
                onClick={() => handleProductClick(product.id)}
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 group-hover:shadow-lg transition-shadow">
                  <SupabaseImage
                    src={imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    width={400}
                    height={400}
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">By {product.artist_name}</p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {product.price ? formatPrice(product.price, product.currency) : 'Price on request'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}