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

export default function TrendingProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      // First, fetch artworks
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(4);

      if (artworksError) {
        console.error('Error fetching artworks:', artworksError);
        return;
      }

      if (!artworks) {
        console.error('No artworks found');
        return;
      }

      console.log('Fetched artworks:', artworks);

      // Then fetch images for each artwork
      const productsWithImages = await Promise.all(
        artworks.map(async (artwork) => {
          const { data: images, error: imagesError } = await supabase
            .from('artwork_images')
            .select('url, is_primary')
            .eq('artwork_id', artwork.id);

          if (imagesError) {
            console.error(`Error fetching images for artwork ${artwork.id}:`, imagesError);
          }

          console.log(`Images for artwork ${artwork.id}:`, images);

          return {
            ...artwork,
            images: images || [],
            image_url: artwork.image_url // Keep the direct image URL if it exists
          };
        })
      );

      console.log('Products with images:', productsWithImages);
      setProducts(productsWithImages);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`);
  };

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
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const imageUrl = product.image_url || 
              (product.images && product.images.length > 0
                ? (product.images.find(img => img.is_primary)?.url || product.images[0]?.url)
                : '/images/placeholder.webp');

            return (
              <div 
                key={product.id} 
                className="group cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-gray-100">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${imageUrl})` }}
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
    </section>
  );
}