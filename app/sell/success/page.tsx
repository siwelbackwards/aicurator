"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

interface Artwork {
  id: string;
  title: string;
  price: number;
  artist_name: string;
  images: { url: string; is_primary: boolean; }[];
}

const trendingProducts = [
  {
    title: 'Whispers of a Distant',
    price: '$1299',
    artist: 'Amara Selene',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80'
  },
  {
    title: 'Echoes in the Fog',
    price: '$1299',
    artist: 'Nico Bastien',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80'
  },
  {
    title: 'The Forgotten Horizon',
    price: '$1299',
    artist: 'Elara Voss',
    image: 'https://images.unsplash.com/photo-1545759843-49d5f0838d8f?auto=format&fit=crop&q=80'
  },
  {
    title: 'Velvet Dreams',
    price: '$1299',
    artist: 'Jasper Thorne',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80'
  }
];

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<Artwork[]>([]);

  useEffect(() => {
    const fetchRecentItems = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/sell/success');
        return;
      }

      const { data: artworks, error } = await supabase
        .from('artworks')
        .select(`
          *,
          images:artwork_images(url, is_primary)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching recent items:', error);
        return;
      }

      setRecentItems(artworks || []);
      setLoading(false);
    };

    fetchRecentItems();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Your item has been listed!</h1>
        <h2 className="text-xl mb-6">What happens next?</h2>

        <ul className="text-left space-y-4 mb-8 max-w-md mx-auto">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Our AI system will analyze your listing to optimize its visibility.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Your item will be matched with potential buyers based on their preferences.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            You'll receive notifications when interested buyers view your listing.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Our team will assist with any inquiries or offers from potential buyers.
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            variant="outline"
            onClick={() => router.push('/sell/new')}
            className="gap-2"
          >
            List Another Item
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="gap-2"
          >
            Home Page
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {recentItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-left mb-6">Your Recent Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentItems.map((item) => {
                const primaryImage = item.images?.find(img => img.is_primary);
                const imageUrl = primaryImage?.url || '/images/placeholder.webp';

                return (
                  <div 
                    key={item.id}
                    className="cursor-pointer group"
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-4">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/images/placeholder.webp';
                        }}
                      />
                    </div>
                    <h3 className="font-medium text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">By: {item.artist_name}</p>
                    <p className="text-green-600 font-bold">£{item.price.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}