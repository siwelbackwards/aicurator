"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/openai';
import Image from 'next/image';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  artist_name: string;
  category: string;
  image_url: string;
  images: { url: string; is_primary: boolean; }[];
  price: number;
  similarity?: number;
  created_at: string;
  location: string;
  year: number;
}

interface SearchProps {
  query: string;
  category?: string;
}

export default function SearchResults({ query, category }: SearchProps) {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status and fetch wishlist if authenticated
  useEffect(() => {
    const checkAuthAndFetchWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        const { data } = await supabase
          .from('wishlist')
          .select('artwork_id')
          .eq('user_id', user.id);
        
        if (data) {
          setWishlist(new Set(data.map(item => item.artwork_id)));
        }
      }
    };

    checkAuthAndFetchWishlist();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        let queryBuilder = supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(url, is_primary)
          `)
          .eq('status', 'approved');

        // If there's a category, filter by it
        if (category) {
          queryBuilder = queryBuilder.ilike('category', `%${category}%`);
        }

        // If there's a search query, add text search
        if (query) {
          queryBuilder = queryBuilder.or(
            `title.ilike.%${query}%,artist_name.ilike.%${query}%,description.ilike.%${query}%`
          );
        }

        const { data, error: searchError } = await queryBuilder;

        if (searchError) {
          throw searchError;
        }

        if (!data || data.length === 0) {
          setResults([]);
        } else {
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch search results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  const handleWishlist = async (e: React.MouseEvent, artworkId: string) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (wishlist.has(artworkId)) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId);
        wishlist.delete(artworkId);
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: user.id, artwork_id: artworkId });
        wishlist.add(artworkId);
      }
      setWishlist(new Set(wishlist));
    } catch (error) {
      console.error('Wishlist error:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results found for "{query}"{category ? ` in category "${category}"` : ''}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {results.map((product) => {
        const primaryImage = product.images?.find(img => img.is_primary);
        const imageUrl = primaryImage?.url || '/images/placeholder.webp';

        return (
          <div 
            key={product.id} 
            className="group cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-gray-100">
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  console.error('Image failed to load:', imageUrl);
                  const img = e.target as HTMLImageElement;
                  img.src = '/images/placeholder.webp';
                }}
              />
            </div>
            <h3 className="font-medium text-lg mb-2">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-2">By: {product.artist_name}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
            <p className="text-green-600 font-bold">£{product.price.toLocaleString()}</p>
            <div className="flex flex-col items-end justify-between">
              {isAuthenticated ? (
                <Button 
                  variant={wishlist.has(product.id) ? "default" : "outline"}
                  className="gap-2"
                  onClick={(e) => handleWishlist(e, product.id)}
                >
                  <Heart className="w-4 h-4" fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                  {wishlist.has(product.id) ? 'Added to wishlist' : 'Add to wishlist'}
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/login');
                  }}
                >
                  <Heart className="w-4 h-4" />
                  Login to save
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}