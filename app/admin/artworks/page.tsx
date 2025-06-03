'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { SupabaseImage } from '@/components/ui/supabase-image';

interface Artwork {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  user_id: string;
  status: string;
  created_at: string;
  images?: { url: string; is_primary: boolean }[];
  profiles?: { full_name: string; email: string };
}

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Separate admin check from artwork fetching
  useEffect(() => {
    // Don't run this effect on server-side rendering
    if (!isClient) return;
    
    const checkAdminStatus = async () => {
      try {
        // Use regular supabase client first to get the user
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session) {
          window.location.href = '/';
          return;
        }

        // Store the access token for API calls
        setAccessToken(session.access_token);

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          // Redirect non-admin users
          window.location.href = '/';
          toast.error('You do not have permission to access the admin area');
          return;
        }

        setIsAdmin(true);
        setInitialized(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        window.location.href = '/';
      }
    };

    checkAdminStatus();
  }, [isClient]);

  // Only fetch artworks when tab changes and admin status is confirmed
  useEffect(() => {
    if (isAdmin && initialized && isClient && accessToken) {
      fetchArtworks(currentTab);
    }
  }, [currentTab, isAdmin, initialized, isClient, accessToken]);

  const fetchArtworks = async (status = 'pending') => {
    if (!isClient || !accessToken) return;
    
    try {
      setLoading(true);
      
      console.log(`⭐ Fetching artworks with status: "${status}"`);
      
      // Determine environment based on window location for more reliable client-side detection
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const baseUrl = isLocalhost
        ? 'http://localhost:9000'
        : '';
      
      console.log(`⭐ Environment detected: ${isLocalhost ? 'development' : 'production'}, using baseUrl: ${baseUrl || 'relative'}`);
      
      // Use our admin API endpoint that bypasses RLS
      const response = await fetch(`${baseUrl}/.netlify/functions/admin-artworks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        console.error('⭐ Admin API call failed:', await response.text());
        throw new Error('Failed to fetch artworks');
      }
      
      const allArtworks = await response.json();
      console.log('⭐ ALL ARTWORKS via admin API:', allArtworks);
      
      // Filter artworks based on status
      const filteredArtworks = allArtworks.filter((artwork: Artwork) => 
        artwork.status.toLowerCase().trim() === status.toLowerCase().trim()
      );
      
      console.log(`⭐ Filtered ${filteredArtworks.length} artworks with status "${status}"`);
      
      if (filteredArtworks.length === 0) {
        setArtworks([]);
        setLoading(false);
        return;
      }
      
      // Now fetch images separately to avoid empty join results
      let artworksWithImages: Artwork[] = [];
      
      if (filteredArtworks.length > 0) {
        // Get artwork IDs
        const artworkIds = filteredArtworks.map((artwork: Artwork) => artwork.id);
        
        // Fetch images for these artworks
        const { data: imagesData, error: imagesError } = await supabase
          .from('artwork_images')
          .select('*')
          .in('artwork_id', artworkIds);
          
        if (imagesError) {
          console.error('⭐ Error fetching artwork images:', imagesError);
        }
        
        // Create a lookup map for images by artwork_id
        const imagesMap: { [key: string]: any[] } = {};
        if (imagesData && imagesData.length > 0) {
          imagesData.forEach((image: any) => {
            if (!imagesMap[image.artwork_id]) {
              imagesMap[image.artwork_id] = [];
            }
            imagesMap[image.artwork_id].push(image);
          });
        }
        
        // Merge artworks with their images
        artworksWithImages = filteredArtworks.map((artwork: Artwork) => ({
          ...artwork,
          images: imagesMap[artwork.id] || [] // Use empty array if no images
        }));
      } else {
        artworksWithImages = filteredArtworks || [];
      }

      // If we have artworks, fetch the user profiles separately
      if (artworksWithImages.length > 0) {
        // Get unique user IDs
        const userIds = Array.from(new Set(artworksWithImages.map((artwork: Artwork) => artwork.user_id)));
        
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('⭐ Error fetching profiles:', profilesError);
        }
          
        // Create a lookup map for profiles
        type ProfileMap = {
          [key: string]: { id: string, full_name: string, email: string }
        };
        
        const profilesMap = (profilesData || []).reduce((acc: ProfileMap, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as ProfileMap);
        
        // Attach profile data to artworks
        const artworksWithProfiles = artworksWithImages.map((artwork: Artwork) => ({
          ...artwork,
          profiles: profilesMap[artwork.user_id] || { id: artwork.user_id, full_name: 'Unknown', email: '' }
        }));
        
        setArtworks(artworksWithProfiles);
      } else {
        setArtworks(artworksWithImages || []);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast.error('Failed to load artworks');
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (artworkId: string, newStatus: string) => {
    if (!isClient || !accessToken) return;
    
    try {
      // Determine environment based on window location for more reliable client-side detection
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const baseUrl = isLocalhost
        ? 'http://localhost:9000'
        : '';
      
      console.log(`⭐ Status update - Environment detected: ${isLocalhost ? 'development' : 'production'}, using baseUrl: ${baseUrl || 'relative'}`);
      
      // Use our admin API endpoint to update status
      const response = await fetch(`${baseUrl}/.netlify/functions/admin-artwork-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ id: artworkId, status: newStatus })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('⭐ Admin status update failed:', errorText);
        throw new Error('Failed to update artwork status');
      }
      
      // Update local state to remove the artwork from current view
      setArtworks(artworks.filter(artwork => artwork.id !== artworkId));
      
      toast.success(`Artwork ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating artwork status:', error);
      toast.error('Failed to update artwork status');
    }
  };

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  if (!isAdmin || !initialized) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Artwork Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} defaultValue="pending" className="flex-1">
          <TabsList>
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          onClick={() => fetchArtworks(currentTab)} 
          disabled={loading}
          variant="outline"
          className="ml-4"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {currentTab === 'pending' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Pending Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending artworks to review</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => {
                // Extract the primary image or first available image
                const imageUrl = artwork.images && artwork.images.length > 0 
                  ? (artwork.images.find(img => img.is_primary)?.url || artwork.images[0].url)
                  : undefined;
                
                return (
                <Card key={artwork.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <Link href={`/artwork/${artwork.id}`}>
                      {imageUrl ? (
                      <SupabaseImage
                        src={imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover cursor-pointer"
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No Image
                        </div>
                      )}
                    </Link>
                  </div>
                  <CardHeader>
                    <CardTitle>
                      <Link href={`/artwork/${artwork.id}`} className="hover:underline">
                        {artwork.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm line-clamp-2">{artwork.description}</p>
                      <p className="font-medium">£{artwork.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Category: {artwork.category}</p>
                      <p className="text-sm text-gray-500">
                        Artist: {artwork.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(artwork.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-4">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => handleUpdateStatus(artwork.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleUpdateStatus(artwork.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </CardFooter>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentTab === 'approved' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Approved Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approved artworks</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => {
                const imageUrl = artwork.images && artwork.images.length > 0 
                  ? (artwork.images.find(img => img.is_primary)?.url || artwork.images[0].url)
                  : undefined;
                
                return (
                <Card key={artwork.id}>
                  <div className="relative aspect-square">
                    <Link href={`/artwork/${artwork.id}`}>
                      {imageUrl ? (
                      <SupabaseImage
                        src={imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover cursor-pointer"
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No Image
                        </div>
                      )}
                    </Link>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">
                      <Link href={`/artwork/${artwork.id}`} className="hover:underline">
                        {artwork.title}
                      </Link>
                    </h3>
                    <p className="text-sm">£{artwork.price.toLocaleString()}</p>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleUpdateStatus(artwork.id, 'pending')}
                      >
                        Move to Pending
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentTab === 'rejected' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Rejected Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No rejected artworks</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => {
                const imageUrl = artwork.images && artwork.images.length > 0 
                  ? (artwork.images.find(img => img.is_primary)?.url || artwork.images[0].url)
                  : undefined;
                
                return (
                <Card key={artwork.id}>
                  <div className="relative aspect-square">
                    <Link href={`/artwork/${artwork.id}`}>
                      {imageUrl ? (
                      <SupabaseImage
                        src={imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover cursor-pointer"
                      />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No Image
                        </div>
                      )}
                    </Link>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">
                      <Link href={`/artwork/${artwork.id}`} className="hover:underline">
                        {artwork.title}
                      </Link>
                    </h3>
                    <p className="text-sm">£{artwork.price.toLocaleString()}</p>
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleUpdateStatus(artwork.id, 'pending')}
                      >
                        Reconsider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 