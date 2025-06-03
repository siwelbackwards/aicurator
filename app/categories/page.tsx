"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface CategoryStats {
  items: string;
  artists: string;
  avgValue: string;
}

interface Category {
  title: string;
  image: string;
  description: string;
  extendedDescription: string;
  stats: CategoryStats;
}

const categoriesData: Category[] = [
  {
    title: 'Paintings',
    image: '/images/categories/art.webp',
    description: 'Discover unique paintings from emerging and established artists',
    extendedDescription: 'Immerse yourself in a world of artistic excellence. Our curated paintings collection spans from contemporary masterpieces to timeless classics, featuring works that push the boundaries of creative expression.',
    stats: {
      items: '1,500+',
      artists: '350+',
      avgValue: '$28,000'
    }
  },
  {
    title: 'Sculptures',
    image: '/images/categories/sculpture.webp',
    description: 'Explore three-dimensional masterpieces',
    extendedDescription: 'Experience the power of form and space through our exceptional sculpture collection. From classical marble works to contemporary installations, each piece tells a unique story through its three-dimensional presence.',
    stats: {
      items: '1,200+',
      artists: '280+',
      avgValue: '$56,000'
    }
  },
  {
    title: 'Accessories',
    image: '/images/categories/accessories.webp',
    description: 'Find the perfect complement to your collection',
    extendedDescription: 'Elevate your collection with our premium selection of accessories. Each piece is carefully chosen for its craftsmanship, historical significance, and potential for appreciation, offering both aesthetic and investment value.',
    stats: {
      items: '3,800+',
      artists: '620+',
      avgValue: '$23,000'
    }
  },
  {
    title: 'Consumables',
    image: '/images/categories/consumables.webp',
    description: 'Premium collectible consumables',
    extendedDescription: 'Indulge in our exclusive range of collectible consumables. From rare vintage wines to limited-edition spirits, each item represents the pinnacle of its category, carefully preserved and authenticated for discerning collectors.',
    stats: {
      items: '950+',
      artists: '150+',
      avgValue: '$53,000'
    }
  },
  {
    title: 'Other',
    image: '/images/categories/others.webp',
    description: 'Unique items that defy categorization',
    extendedDescription: 'Explore our most intriguing offerings that transcend traditional categories. This carefully curated selection features one-of-a-kind pieces that represent the intersection of art, innovation, and collectible value.',
    stats: {
      items: '750+',
      artists: '180+',
      avgValue: '$37,000'
    }
  }
];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(categoriesData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryStats() {
      try {
        // Fetch all artwork data
        const { data: artworks, error } = await supabase
          .from('artworks')
          .select('id, category, artist_name, price')
          .eq('status', 'approved');

        // Check for error with improved handling
        if (error && error.message) {
          console.error('Error fetching artworks:', error.message);
          setIsLoading(false);
          return;
        }

        // Check if we received artworks data
        if (!artworks || artworks.length === 0) {
          console.log('No approved artworks found or empty response');
          setIsLoading(false);
          return;
        }

        console.log(`Fetched ${artworks.length} approved artworks`);

        // Process data by category
        const categoryData: Record<string, { items: number; artists: Set<string>; totalValue: number }> = {};
        
        interface Artwork {
          id: string;
          category?: string;
          artist_name: string;
          price?: number;
        }

        // Create a mapping between database category names and UI category names
        const categoryMapping: Record<string, string> = {
          // Map variations of category names to our standardized categories
          'painting': 'paintings',
          'paintings': 'paintings',
          'sculpture': 'sculptures', 
          'sculptures': 'sculptures',
          'accessory': 'accessories',
          'accessories': 'accessories',
          'consumable': 'consumables',
          'consumables': 'consumables',
          'other': 'other',
          // Legacy mappings
          'art': 'paintings',
          'others': 'other',
          // Map removed categories to 'other'
          'photography': 'other',
          'digital': 'other',
          'mixed-media': 'other',
          'mixed media': 'other',
          // Default for any unmapped categories
          'default': 'other'
        };

        // Process each artwork and categorize it
        artworks?.forEach((artwork: Artwork) => {
          // Normalize the category name (lowercase, trim)
          const rawCategory = (artwork.category || 'other').toLowerCase().trim();
          
          // Map the raw category to our standardized category
          const mappedCategory = categoryMapping[rawCategory] || 'other';
          
          console.log(`Artwork category: ${rawCategory}, mapped to: ${mappedCategory}`);
          
          if (!categoryData[mappedCategory]) {
            categoryData[mappedCategory] = {
              items: 0,
              artists: new Set<string>(),
              totalValue: 0
            };
          }
          
          categoryData[mappedCategory].items++;
          categoryData[mappedCategory].artists.add(artwork.artist_name);
          categoryData[mappedCategory].totalValue += artwork.price || 0;
        });

        console.log('Processed category data:', 
          Object.entries(categoryData).map(([key, value]) => ({
            category: key,
            items: value.items,
            artists: value.artists.size,
            totalValue: value.totalValue
          }))
        );

        // Update categories with real data
        const updatedCategories = categories.map(category => {
          // Normalize the category title for matching
          const categoryKey = category.title.toLowerCase().trim();
          
          // Try to find the matching category data
          const stats = categoryData[categoryKey] || { items: 0, artists: new Set(), totalValue: 0 };
          
          console.log(`Processing UI category: ${category.title} (key: ${categoryKey}), found stats:`, 
            { items: stats.items, artists: stats.artists.size, totalValue: stats.totalValue }
          );
          
          // Calculate average value and multiply by 1.5
          const avgValue = stats.items > 0 
            ? (stats.totalValue / stats.items) * 1.5 
            : 0;
          
          // Format numbers
          const formattedAvgValue = avgValue > 0 
            ? avgValue >= 1000000 
              ? `$${(avgValue / 1000000).toFixed(1)}M` 
              : avgValue >= 1000 
                ? `$${(avgValue / 1000).toFixed(1)}K` 
                : `$${Math.round(avgValue).toLocaleString()}`
            : '$0';
            
          return {
            ...category,
            stats: {
              items: stats.items > 0 ? `${stats.items.toLocaleString()}+` : '0',
              artists: stats.artists.size > 0 ? `${stats.artists.size}+` : '0',
              avgValue: formattedAvgValue
            }
          };
        });
        
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error in fetchCategoryStats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryStats();
  }, []);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams({
      category: category.toLowerCase()
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[300px] -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Categories</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Explore our curated collection of luxury items across various categories, each representing the pinnacle of craftsmanship and artistic excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading category statistics...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((category) => (
            <div
              key={category.title}
              className="group cursor-pointer bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => handleCategoryClick(category.title)}
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${category.image})` }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {category.extendedDescription}
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Items</div>
                    <div className="font-bold text-lg">{category.stats.items}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Artists</div>
                    <div className="font-bold text-lg">{category.stats.artists}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Avg. Value</div>
                    <div className="font-bold text-lg">{category.stats.avgValue}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}