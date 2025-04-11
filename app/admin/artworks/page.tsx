'use client';

import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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

interface Artwork {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  user_id: string;
  status: string;
  created_at: string;
  images: { url: string; is_primary: boolean }[];
  profiles: { full_name: string; email: string };
}

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          window.location.href = '/';
          return;
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
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
    if (isAdmin && initialized && isClient) {
      fetchArtworks(currentTab);
    }
  }, [currentTab, isAdmin, initialized, isClient]);

  const fetchArtworks = async (status = 'pending') => {
    if (!isClient) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('artworks')
        .select(`
          *,
          images:artwork_images(url, is_primary),
          profiles:profiles(full_name, email)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtworks(data || []);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (artworkId: string, newStatus: string) => {
    if (!isClient) return;
    
    try {
      const { error } = await supabase
        .from('artworks')
        .update({ status: newStatus })
        .eq('id', artworkId);

      if (error) throw error;
      
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
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} defaultValue="pending">
        <TabsList className="mb-8">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <h2 className="text-xl font-semibold">Pending Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending artworks to review</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((artwork) => (
                <Card key={artwork.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.images?.[0]?.url || '/placeholder.webp'}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{artwork.title}</CardTitle>
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <h2 className="text-xl font-semibold mb-4">Approved Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approved artworks</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => (
                <Card key={artwork.id}>
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.images?.[0]?.url || '/placeholder.webp'}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{artwork.title}</h3>
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <h2 className="text-xl font-semibold mb-4">Rejected Artworks</h2>
          {loading ? (
            <div className="text-center py-8">Loading artworks...</div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No rejected artworks</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((artwork) => (
                <Card key={artwork.id}>
                  <div className="relative aspect-square">
                    <Image
                      src={artwork.images?.[0]?.url || '/placeholder.webp'}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{artwork.title}</h3>
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 