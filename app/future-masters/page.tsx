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
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 2,
    name: 'Marcus Chen',
    image: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80',
    location: 'Singapore',
    specialty: 'Digital Mixed Media',
    description: 'Pioneering artist merging traditional Eastern aesthetics with cutting-edge digital techniques.',
    stats: {
      exhibitions: 15,
      collections: 10,
      awards: 4
    },
    recentWorks: [
      'https://images.unsplash.com/photo-1615247001958-f4bc92fa6a4a?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613027667527-c45d3c4dfe8b?auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 3,
    name: 'Sofia Patel',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80',
    location: 'Mumbai, India',
    specialty: 'Sculptural Installations',
    description: 'Emerging talent creating immersive installations that challenge spatial perception.',
    stats: {
      exhibitions: 8,
      collections: 5,
      awards: 2
    },
    recentWorks: [
      'https://images.unsplash.com/photo-1545759843-49d5f0838d8f?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 4,
    name: 'Lucas Schmidt',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80',
    location: 'Berlin, Germany',
    specialty: 'Neo-Expressionism',
    description: 'Up-and-coming artist revitalizing expressionist traditions with contemporary themes.',
    stats: {
      exhibitions: 10,
      collections: 6,
      awards: 3
    },
    recentWorks: [
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&q=80'
    ]
  }
];

export default function FutureMastersPage() {
  const router = useRouter();

  const handleViewPortfolio = () => {
    router.push('/product');
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
              onClick={handleViewPortfolio}
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
                  onClick={handleViewPortfolio}
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