"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { formatSupabaseUrl } from '@/lib/utils';

interface TrendingProduct {
  id: string;
  title: string;
  price: number;
  artist_name: string;
  images: Array<{
    file_path: string;
    is_primary: boolean;
  }>;
}

// Fallback products in case of loading issues
const fallbackProducts = [
  {
    id: 'fallback-1',
    title: 'Whispers of a Distant',
    price: 1299,
    artist_name: 'Amara Selene',
    images: [{ file_path: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80', is_primary: true }]
  },
  {
    id: 'fallback-2',
    title: 'Echoes in the Fog',
    price: 1299,
    artist_name: 'Nico Bastien',
    images: [{ file_path: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80', is_primary: true }]
  },
  {
    id: 'fallback-3',
    title: 'The Forgotten Horizon',
    price: 1299,
    artist_name: 'Elara Voss',
    images: [{ file_path: 'https://images.unsplash.com/photo-1545759843-49d5f0838d8f?auto=format&fit=crop&q=80', is_primary: true }]
  },
  {
    id: 'fallback-4',
    title: 'Velvet Dreams',
    price: 1299,
    artist_name: 'Jasper Thorne',
    images: [{ file_path: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80', is_primary: true }]
  }
];

export default function ConfirmationPage() {
  const router = useRouter();
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchTrendingProducts = async () => {
      try {
        if (abortController.signal.aborted) return;
        
        const { data: artworks, error } = await supabase
          .from('artworks')
          .select(`
            id,
            title,
            price,
            artist_name,
            images:artwork_images(file_path, is_primary)
          `)
          .eq('status', 'approved')
          .order('price', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching trending products:', error);
          throw error;
        }

        if (abortController.signal.aborted) return;

        if (artworks && artworks.length > 0) {
          setTrendingProducts(artworks);
        } else {
          // Use fallback products if no data found
          setTrendingProducts(fallbackProducts);
        }
        
        setError(false);
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch trending products:', err);
          setError(true);
          // Use fallback products on error
          setTrendingProducts(fallbackProducts);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTrendingProducts();
    
    return () => {
      abortController.abort();
    };
  }, []);

  const handleProductClick = (productId: string) => {
    if (productId.startsWith('fallback-')) {
      // For fallback products, just go to general product page
      router.push('/categories');
    } else {
      router.push(`/product/${productId}`);
    }
  };

  const getImageUrl = (product: TrendingProduct) => {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    if (!primaryImage) {
      return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80';
    }
    
    // If it's already a full URL (fallback), use as is
    if (primaryImage.file_path.startsWith('http')) {
      return primaryImage.file_path;
    }
    
    // Otherwise format as Supabase URL
    return formatSupabaseUrl(primaryImage.file_path);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Thank you for your interest!</h1>
        <h2 className="text-xl mb-6">What happens next?</h2>

        <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            A dedicated AI Curator advisor would reach you via email/phone in next 24 hours.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            They would organize the product viewing.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Product evaluation & verification to be close.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Exchange of legal contract to close the transaction.
          </li>
        </ul>

        <Button 
          onClick={() => router.push('/')}
          className="w-full max-w-xs mb-16"
        >
          Ok
        </Button>

        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-left mb-6">Trending Products</h2>
          <p className="text-gray-600 text-left mb-8">
            Explore more exceptional pieces from our curated collection.
            {error && " (Showing featured selections)"}
          </p>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-lg bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <div 
                  key={product.id}
                  className="cursor-pointer group"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-4">
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url(${getImageUrl(product)})` }}
                    />
                  </div>
                  <h3 className="font-medium text-lg mb-1">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">By: {product.artist_name}</p>
                  <p className="text-green-600 font-bold">${product.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}