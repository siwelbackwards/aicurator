"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const artists = [
  {
    id: 1,
    name: 'Elena Rossi',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
    location: 'Florence, Italy',
    specialty: 'Contemporary Abstract',
    description: 'Rising star in the contemporary art scene, known for her bold use of color and innovative techniques.',
    stats: {
      exhibitions: 12,
      collections: 8,
      awards: 3
    },
    recentWorks: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Elena%20Rossi3.jpg'
    ]
  },
  {
    id: 2,
    name: 'Yayoi Kusama',
    image: 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/yayoi.webp',
    location: 'Tokyo, Japan',
    specialty: 'Contemporary Art',
    description: 'Visionary artist known for her immersive installations and polka dot patterns that explore infinity and self-obliteration.',
    stats: {
      exhibitions: 45,
      collections: 30,
      awards: 12
    },
    recentWorks: [
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Yayoi%20Kusama2.jpg',
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Yayoi%20Kusama3.webp'
    ]
  },
  {
    id: 3,
    name: 'Ai Weiwei',
    image: 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/ai%20weiwei.jpg',
    location: 'Beijing, China',
    specialty: 'Conceptual Art',
    description: 'Provocative artist and activist whose work challenges political and social issues through various mediums.',
    stats: {
      exhibitions: 38,
      collections: 25,
      awards: 15
    },
    recentWorks: [
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Ai%20Weiwei2.jpg',
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Ai%20Weiwei3.jpeg'
    ]
  },
  {
    id: 4,
    name: 'Olafur Eliasson',
    image: 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/olafur.jpg',
    location: 'Copenhagen, Denmark',
    specialty: 'Installation Art',
    description: 'Innovative artist creating immersive experiences that explore perception, movement, and environmental issues.',
    stats: {
      exhibitions: 42,
      collections: 28,
      awards: 10
    },
    recentWorks: [
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Olafur%20Eliasson2.webp',
      'https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/public/Olafur%20Eliasson3.jpg'
    ]
  }
];

export default function FutureMastersPage() {
  const router = useRouter();

  const handleViewPortfolio = (e: React.MouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();
    // Do nothing - intentionally disabled
    console.log('Portfolio view disabled as requested');
    // No router.push call, so links don't work
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Future Masters</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Discover tomorrow's artistic legends today. Our AI-powered platform identifies emerging talents 
              poised to make a significant impact on the art world.
            </p>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {artists.map((artist) => (
            <div 
              key={artist.id} 
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              onClick={(e) => handleViewPortfolio(e)}
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${artist.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{artist.name}</h3>
                  <p className="text-gray-200">{artist.location} · {artist.specialty}</p>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6">{artist.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Exhibitions</div>
                    <div className="font-bold text-lg">{artist.stats.exhibitions}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Collections</div>
                    <div className="font-bold text-lg">{artist.stats.collections}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Awards</div>
                    <div className="font-bold text-lg">{artist.stats.awards}</div>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  {artist.recentWorks.map((work, index) => (
                    <div
                      key={index}
                      className="flex-1 aspect-square relative rounded-lg overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${work})` }}
                      />
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full gap-2"
                  onClick={(e) => handleViewPortfolio(e)}
                >
                  View Full Portfolio
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}