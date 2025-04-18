"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
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
      try {
        const { data: artworks, error } = await supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(file_path, is_primary)
          `)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Error fetching artworks:', error);
          return;
        }

        if (artworks) {
          // Get public URLs for all images
          const artworksWithUrls = artworks.map(artwork => ({
            ...artwork,
            images: artwork.images?.map((image: ArtworkImage) => ({
              ...image,
              url: image.file_path
            }))
          }));
          
          console.log('Fetched artworks:', artworksWithUrls);
          setProducts(artworksWithUrls);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
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
    setTimeout(() => setIsAnimating(false), 500);
  };

  const slidePrevious = () => {
    if (isAnimating || startIndex <= 0) return;
    setIsAnimating(true);
    setStartIndex(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleProducts.map((product) => {
            const imageUrl = product.images?.[0]?.url;
            console.log('Product:', product.title, 'Image URL:', imageUrl);

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
                      priority={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-lg mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-2">By: {product.artist_name}</p>
                <p className="text-green-600 font-bold">£{product.price.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}