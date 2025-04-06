"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  image_url: string;
  images: { url: string; is_primary: boolean; }[];
}

const VISIBLE_ITEMS = 4;

export default function TrendingProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12);

      if (artworksError) {
        console.error('Error fetching artworks:', artworksError);
        return;
      }

      if (!artworks) {
        console.error('No artworks found');
        return;
      }

      const productsWithImages = await Promise.all(
        artworks.map(async (artwork) => {
          const { data: images, error: imagesError } = await supabase
            .from('artwork_images')
            .select('url, is_primary')
            .eq('artwork_id', artwork.id);

          if (imagesError) {
            console.error(`Error fetching images for artwork ${artwork.id}:`, imagesError);
          }

          return {
            ...artwork,
            images: images || [],
            image_url: artwork.image_url
          };
        })
      );

      setProducts(productsWithImages);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  const slideNext = () => {
    if (isAnimating || startIndex >= products.length - VISIBLE_ITEMS) return;
    setIsAnimating(true);
    setStartIndex(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 500); // Match this with CSS transition duration
  };

  const slidePrevious = () => {
    if (isAnimating || startIndex <= 0) return;
    setIsAnimating(true);
    setStartIndex(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 500); // Match this with CSS transition duration
  };

  // Get visible items plus one extra on each side for smooth animation
  const visibleProducts = products.slice(
    Math.max(0, startIndex),
    Math.min(startIndex + VISIBLE_ITEMS, products.length)
  );

  if (loading) {
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
        
        <div className="relative overflow-hidden">
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(0px)`,
              width: '100%'
            }}
          >
            {visibleProducts.map((product) => {
              const imageUrl = product.image_url || 
                (product.images && product.images.length > 0
                  ? (product.images.find(img => img.is_primary)?.url || product.images[0]?.url)
                  : '/images/placeholder.webp');

              return (
                <div 
                  key={product.id} 
                  className="group cursor-pointer transition-all duration-500 ease-in-out"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        console.error('Image failed to load:', imageUrl);
                        const img = e.target as HTMLImageElement;
                        img.src = '/images/placeholder.webp';
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-lg mb-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">By: {product.artist_name}</p>
                  <p className="text-green-600 font-bold">${product.price.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}