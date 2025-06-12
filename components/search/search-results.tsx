"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase-client';
import { generateTypoVariations } from '@/lib/fuzzy-search';
import Image from 'next/image';
import { formatPrice } from '@/lib/currency-utils';

interface SearchResult {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  currency?: string;
  category: string;
  images: { url: string; is_primary: boolean; }[];
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
          setWishlist(new Set(data.map((item: any) => item.artwork_id)));
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
            id,
            title,
            artist_name,
            price,
            currency,
            category,
            description,
            materials,
            images:artwork_images(url, is_primary)
          `)
          .eq('status', 'approved');

        // Handle category filtering if not 'all'
        if (category && category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }

        let data = null;
        let searchError = null;

        // Handle text search if query exists
        if (query) {
          const searchTerm = query.trim();
          
          // Debug: Log what we're searching for and what's in the database
          console.log(`🔍 Searching for: "${searchTerm}"`);
          
          // First, let's see what's actually in the database
          const { data: allItems, error: debugError } = await supabase
            .from('artworks')
            .select('id, title, artist_name, description')
            .eq('status', 'approved')
            .limit(10);
          
          if (allItems && allItems.length > 0) {
            console.log(`📦 Sample database items:`, allItems.map((item: any) => item.title));
          } else {
            console.log(`📦 No approved items found in database`);
          }
          
          // First try exact and partial matches
          const exactQuery = queryBuilder.or(
            `title.ilike.%${searchTerm}%,artist_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,materials.ilike.%${searchTerm}%`
          );

          const { data: exactResults, error: exactError } = await exactQuery;
          
          if (exactError) {
            throw exactError;
          }

          // If we have results, use them
          if (exactResults && exactResults.length > 0) {
            data = exactResults;
          } else {
            // If no exact results, try fuzzy search
            let fuzzyResults: any[] = [];

            // First, try variations of the entire search term (for cases like "G700" vs "G 700")
            const fullQueryVariations = generateTypoVariations(searchTerm);
            console.log(`🔍 Fuzzy search for "${searchTerm}" generated ${fullQueryVariations.length} variations:`, fullQueryVariations.slice(0, 20));
            
            // Let's specifically check if "whiskey" is in our variations when searching for "wiskey"
            if (searchTerm.toLowerCase().includes('wiskey')) {
              const whiskeyVariations = fullQueryVariations.filter(v => v.includes('whiskey'));
              console.log(`🥃 Found whiskey variations:`, whiskeyVariations);
            }
            
            for (const variation of fullQueryVariations.slice(0, 50)) { // Limit to first 50 to avoid too many queries
              console.log(`🔍 Testing variation: "${variation}"`);
              
              const fuzzyQuery = supabase
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
                  images:artwork_images(url, is_primary)
                `)
                .eq('status', 'approved')
                .or(
                  `title.ilike.%${variation}%,artist_name.ilike.%${variation}%,description.ilike.%${variation}%,category.ilike.%${variation}%,materials.ilike.%${variation}%`
                );

              // Apply category filter to fuzzy search too
              if (category && category !== 'all') {
                fuzzyQuery.eq('category', category);
              }

              const { data: fuzzyData, error: fuzzyError } = await fuzzyQuery;
              if (fuzzyError) {
                console.error(`❌ Error testing variation "${variation}":`, fuzzyError);
              } else if (fuzzyData && fuzzyData.length > 0) {
                console.log(`✅ Found ${fuzzyData.length} results for variation "${variation}"`);
                console.log(`📋 Results:`, fuzzyData.map((item: any) => item.title));
                fuzzyResults = [...fuzzyResults, ...fuzzyData];
              }
            }

            // Remove duplicates based on ID
            const uniqueResults = fuzzyResults.filter((item: any, index: number, self: any[]) => 
              index === self.findIndex((t: any) => t.id === item.id)
            );

            console.log(`🎯 Final fuzzy search results: ${uniqueResults.length} items found`);
            data = uniqueResults;
          }
        } else {
          // No query, just apply category filter
          const { data: allResults, error: allError } = await queryBuilder;
          data = allResults;
          searchError = allError;
        }

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
        <p className="text-gray-500">
          {category && !query 
            ? `No results found in category "${category}"`
            : query && !category
            ? `No results found for "${query}"`
            : `No results found for "${query}" in category "${category}"`
          }
        </p>
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
            <p className="text-green-600 font-bold">{formatPrice(product.price, product.currency)}</p>
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