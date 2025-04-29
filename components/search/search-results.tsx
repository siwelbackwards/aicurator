"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase';
import SupabaseImage from '@/components/ui/supabase-image';

interface SearchResult {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  category: string;
  images: { url: string; is_primary: boolean; }[];
}

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status and fetch wishlist if authenticated
  useEffect(() => {
    const checkAuthAndFetchWishlist = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        setIsAuthenticated(!!user);

        if (user) {
          const { data, error: wishlistError } = await supabase
            .from('wishlist')
            .select('artwork_id')
            .eq('user_id', user.id);
          
          if (wishlistError) throw wishlistError;
          
          if (data) {
            setWishlist(new Set(data.map(item => item.artwork_id as string)));
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuthAndFetchWishlist();
  }, []);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        let queryBuilder = supabase
          .from('artworks')
          .select(`
            id,
            title,
            artist_name,
            price,
            category,
            images:artwork_images(
              url,
              is_primary
            )
          `)
          .eq('status', 'approved')
          .ilike('title', `%${query}%`);

        if (category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }

        const { data, error: queryError } = await queryBuilder;
        if (queryError) throw queryError;

        setResults(data as SearchResult[]);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while searching');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  const handleProductClick = (id: string) => {
    router.push(`/artwork/${id}`);
  };

  const handleWishlist = async (e: React.MouseEvent, artworkId: string) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const isInWishlist = wishlist.has(artworkId);
      
      if (isInWishlist) {
        const { error: deleteError } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId);
        
        if (deleteError) throw deleteError;
        setWishlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(artworkId);
          return newSet;
        });
      } else {
        const { error: insertError } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            artwork_id: artworkId
          });
        
        if (insertError) throw insertError;
        setWishlist(prev => {
          const newSet = new Set(prev);
          newSet.add(artworkId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((artwork) => (
        <div
          key={artwork.id}
          className="group cursor-pointer"
          onClick={() => handleProductClick(artwork.id)}
        >
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <SupabaseImage
              src={artwork.images[0]?.url || ''}
              alt={artwork.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
              onClick={(e) => handleWishlist(e, artwork.id)}
            >
              <Heart
                className={`h-5 w-5 ${
                  wishlist.has(artwork.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
              />
            </Button>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium">{artwork.title}</h3>
            <p className="text-sm text-gray-500">{artwork.artist_name}</p>
            <p className="mt-1 font-medium">${artwork.price.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}