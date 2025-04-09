'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface Artwork {
  id: string;
  title: string;
  price: number;
  status: string;
  images: { url: string; is_primary: boolean }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const { data, error } = await supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(url, is_primary)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setArtworks(data || []);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [router]);

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <Link href="/upload">
          <Button>Upload New Artwork</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <div key={artwork.id} className="border rounded-lg overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={artwork.images?.[0]?.url || '/placeholder.webp'}
                alt={artwork.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{artwork.title}</h3>
              <p className="text-gray-600">£{artwork.price.toLocaleString()}</p>
              <div className="flex justify-between items-center mt-4">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  artwork.status === 'approved' ? 'bg-green-100 text-green-800' :
                  artwork.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {artwork.status}
                </span>
                <Link href={`/artwork/${artwork.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {artworks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't uploaded any artworks yet.</p>
          <Link href="/upload">
            <Button>Upload Your First Artwork</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 