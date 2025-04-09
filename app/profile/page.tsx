"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface Profile {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  user_type: string;
  avatar_url?: string;
  email?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artworks, setArtworks] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          router.push('/sign-in?redirectedFrom=/profile');
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user's artworks
        const { data: artworksData, error: artworksError } = await supabase
          .from('artworks')
          .select(`
            *,
            artwork_images (
              url,
              is_primary
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (artworksError) throw artworksError;
        setArtworks(artworksData || []);

      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/sign-in?redirectedFrom=/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.title} {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-gray-600 capitalize">{profile.user_type}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">My Artworks</h2>
          {artworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="border rounded-lg overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.artwork_images?.find((img: any) => img.is_primary)?.url || '/placeholder.webp'}
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
                      <Button variant="outline" onClick={() => router.push(`/artwork/${artwork.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't uploaded any artworks yet.</p>
              <Button onClick={() => router.push('/sell/new')}>
                Upload Your First Artwork
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}