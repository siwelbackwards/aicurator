"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { useRouter } from 'next/navigation';

interface ArtworkDetailProps {
  artworkId: string;
}

interface Artwork {
  id: string;
  title: string;
  description: string;
  price: number;
  artist_name: string;
  location: string;
  year: number;
  provenance: string;
  status: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
  images: {
    url: string;
    is_primary: boolean;
    file_path: string;
  }[];
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function ArtworkDetailClient({ artworkId }: ArtworkDetailProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(file_path, is_primary, url)
          `)
          .eq('id', artworkId)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Artwork not found');
        }

        // Parse dimensions if it's a string
        if (data.dimensions && typeof data.dimensions === 'string') {
          try {
            data.dimensions = JSON.parse(data.dimensions);
          } catch (e) {
            console.error('Failed to parse dimensions:', e);
            // Keep the original value if parsing fails
          }
        }

        // Fetch user profile data for the artist
        if (data.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', data.user_id)
            .single();

          if (profileData) {
            data.profiles = profileData;
          }
        }

        setArtwork(data);
      } catch (error: any) {
        console.error('Error fetching artwork:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (artworkId) {
      fetchArtwork();
    }
  }, [artworkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Artwork Not Found</h1>
        <p className="mb-8 text-gray-600">The artwork you're looking for is not available or does not exist.</p>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % (artwork.images?.length || 1));
  };

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + (artwork.images?.length || 1)) % (artwork.images?.length || 1));
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              {artwork.images && artwork.images.length > 0 ? (
                <SupabaseImage
                  src={artwork.images[currentImage]?.file_path}
                  alt={artwork.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                disabled={!artwork.images || artwork.images.length <= 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                disabled={!artwork.images || artwork.images.length <= 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {artwork.images && artwork.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg ${
                    currentImage === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <SupabaseImage
                    src={image.file_path}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Artwork Info */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{artwork.title}</h1>
            <p className="text-xl text-green-600 font-bold">£{artwork.price.toLocaleString()}</p>
            <p className="text-gray-600">{artwork.description}</p>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Artist</div>
                <div>{artwork.artist_name}</div>
                
                <div className="text-gray-500">Year</div>
                <div>{artwork.year}</div>
                
                <div className="text-gray-500">Location</div>
                <div>{artwork.location}</div>
                
                {artwork.dimensions && (
                  <>
                    <div className="text-gray-500">Dimensions</div>
                    <div>
                      {artwork.dimensions.width} × {artwork.dimensions.height} × {artwork.dimensions.depth} {artwork.dimensions.unit}
                    </div>
                  </>
                )}
              </div>
            </div>

            {artwork.provenance && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Provenance</h3>
                <p className="text-gray-600">{artwork.provenance}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button size="lg" className="flex-1">
                Contact Seller
              </Button>
              <Button size="lg" variant="outline" className="flex-1 gap-2">
                <Heart className="w-5 h-5" />
                Add to Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 