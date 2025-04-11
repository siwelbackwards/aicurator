"use client";

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const recommendations = [
  {
    id: 1,
    title: 'Abstract Harmony',
    artist: 'Elena Rossi',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
    description: 'A stunning masterpiece that perfectly aligns with your appreciation for bold colors and abstract expressions.',
    matchScore: 98,
    price: 10000,
    tags: ['Abstract', 'Contemporary', 'Mixed Media']
  },
  {
    id: 2,
    title: 'Atelier "La Californie"',
    artist: 'Pablo Picasso',
    image: 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Olafur%20Eliasson3.jpg',
    description: 'A powerful masterpiece that resonates with your collection theme.',
    matchScore: 95,
    price: 3300,
    tags: ['Cubism', 'Modern Art', 'Oil', 'Political', 'Monochrome']
  },
  {
    id: 3,
    title: 'Untitled (Woman Sitting)',
    artist: 'Pablo Picasso',
    image: 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/picasso%20woman.webp',
    description: 'An impressionist masterpiece that complements your existing collection of nature-themed artwork.',
    matchScore: 94,
    price: 5000,
    tags: ['Post-Impressionism', 'Landscape', 'Oil', 'Night Scene', 'Expressionist']
  }
];

export default function BestMatchesPage() {
  const router = useRouter();

  const handleItemClick = () => {
    router.push('/product');
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
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Best Matches</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Discover pieces that perfectly complement your collection, curated by our advanced AI based on your preferences and collecting history.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={handleItemClick}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="aspect-[4/3] md:aspect-auto relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                </div>
                
                <div className="p-6 md:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-4">by {item.artist}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Match Score</div>
                      <div className="text-2xl font-bold text-green-600">{item.matchScore}%</div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{item.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Starting Price</div>
                      <div className="text-2xl font-bold">${item.price}</div>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Heart className="w-4 h-4" />
                      Add to wishlist
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}