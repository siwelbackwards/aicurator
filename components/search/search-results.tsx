"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/openai';

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
  category: string;
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

  // Search functionality
  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let searchQuery = supabase
          .from('artworks')
          .select('*')
          .eq('status', 'approved');

        if (query) {
          searchQuery = searchQuery.or(
            `title.ilike.%${query}%,description.ilike.%${query}%,artist_name.ilike.%${query}%`
          );
        }

        if (category && category !== 'All') {
          searchQuery = searchQuery.eq('category', category.toLowerCase());
        }

        const { data: artworks, error: searchError } = await searchQuery
          .order('created_at', { ascending: false });

        if (searchError) {
          throw new Error('Failed to search items');
        }

        // Transform the data to include images
        const itemsWithImages = await Promise.all(
          (artworks || []).map(async (artwork) => {
            const { data: images } = await supabase
              .from('artwork_images')
              .select('url, is_primary')
              .eq('artwork_id', artwork.id);
            
            return {
              ...artwork,
              images: images || [],
              image_url: artwork.image_url
            };
          })
        );

        setResults(itemsWithImages);
      } catch (error) {
        console.error('Search error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query, category]);

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
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-6 bg-white p-6 shadow-sm animate-pulse">
              <div className="w-48 h-48 bg-gray-200 flex-shrink-0 rounded-lg" />
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="w-32 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            {category !== 'All' 
              ? `Try searching in all categories or adjust your search terms.`
              : `Try adjusting your search terms or browse our recent items.`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="space-y-6">
        {results.map((result) => (
          <div 
            key={result.id} 
            className="flex gap-6 bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-lg"
            onClick={() => router.push(`/product/${result.id}`)}
          >
            <div className="relative w-48 h-48 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={
                  result.image_url || 
                  (result.images && result.images.length > 0
                    ? (result.images.find(img => img.is_primary)?.url || result.images[0]?.url)
                    : '/images/placeholder.webp')
                }
                alt={result.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  console.error('Image failed to load:', result.image_url);
                  const img = e.target as HTMLImageElement;
                  img.src = '/images/placeholder.webp';
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">{result.title}</h3>
              <p className="text-gray-600 mb-4">{result.description}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-sm text-gray-600">Category:</div>
                  <div className="font-medium">{result.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Artist:</div>
                  <div className="font-medium">{result.artist_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Location:</div>
                  <div className="font-medium">{result.location}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Year:</div>
                  <div className="font-medium">{result.year}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div>
                <div className="text-sm text-gray-600 text-right">Estimated value:</div>
                <div className="text-xl font-bold text-green-600">
                  Starting at £{result.price.toLocaleString()}
                </div>
              </div>
              {isAuthenticated ? (
                <Button 
                  variant={wishlist.has(result.id) ? "default" : "outline"}
                  className="gap-2"
                  onClick={(e) => handleWishlist(e, result.id)}
                >
                  <Heart className="w-4 h-4" fill={wishlist.has(result.id) ? "currentColor" : "none"} />
                  {wishlist.has(result.id) ? 'Added to wishlist' : 'Add to wishlist'}
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
        ))}
      </div>
    </div>
  );
}