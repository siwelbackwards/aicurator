"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FutureMastersArtist {
  id: string;
  name: string;
  location: string;
  specialty: string;
  description: string;
  image_url: string;
  exhibitions: number;
  collections: number;
  awards: number;
  recent_work_1_url?: string;
  recent_work_2_url?: string;
  artist_name_for_search: string;
  is_active: boolean;
  display_order: number;
}

export default function FutureMastersPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<FutureMastersArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        console.log('🔍 Future Masters: Fetching artists...');

        // Try the Netlify function first
        let response = await fetch('/.netlify/functions/future-masters-artists');
        console.log('📡 Future Masters: Netlify function response status:', response.status);

        if (!response.ok) {
          console.log('❌ Future Masters: Netlify function failed, trying direct Supabase...');

          // Fallback to direct Supabase call for development
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data, error } = await supabase
            .from('future_masters_artists')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (error) throw error;
          setArtists(data || []);
          console.log('✅ Future Masters: Fetched artists directly from Supabase:', data?.length);
        } else {
          const data = await response.json();
          setArtists(data);
          console.log('✅ Future Masters: Fetched artists from Netlify function:', data.length);
        }
      } catch (err) {
        console.error('❌ Future Masters: Error fetching artists:', err);
        setError('Failed to load artists. Please try again later.');
        toast.error('Failed to load artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleViewPortfolio = async (e: React.MouseEvent, artist: FutureMastersArtist) => {
    e.stopPropagation();

    try {
      // Navigate to search page with artist name
      router.push(`/search?q=${encodeURIComponent(artist.artist_name_for_search)}`);
    } catch (error) {
      console.error('Error navigating to search:', error);
      toast.error('Failed to navigate to artist portfolio');
    }
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading future masters...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No artists available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                onClick={(e) => handleViewPortfolio(e, artist)}
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${artist.image_url})` }}
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
                      <div className="font-bold text-lg">{artist.exhibitions}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Collections</div>
                      <div className="font-bold text-lg">{artist.collections}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Awards</div>
                      <div className="font-bold text-lg">{artist.awards}</div>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    {artist.recent_work_1_url && (
                      <div className="flex-1 aspect-square relative rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${artist.recent_work_1_url})` }}
                        />
                      </div>
                    )}
                    {artist.recent_work_2_url && (
                      <div className="flex-1 aspect-square relative rounded-lg overflow-hidden">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${artist.recent_work_2_url})` }}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={(e) => handleViewPortfolio(e, artist)}
                  >
                    View Full Portfolio
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}