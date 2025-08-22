"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, ArrowUp, ArrowDown, Search } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { formatPrice } from '@/lib/currency-utils';

interface Artwork {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  currency?: string;
  description?: string;
  category?: string;
  status: string;
  primary_image_path?: string;
  image_paths?: string[];
}

interface TrendingProduct {
  id: string;
  artwork_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  artwork?: Artwork;
}

export default function TrendingProductsAdmin() {
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [availableArtworks, setAvailableArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Admin check
  useEffect(() => {
    if (!isClient) return;

    const abortController = new AbortController();

    const checkAdminStatus = async () => {
      try {
        if (abortController.signal.aborted) return;

        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session) {
          if (!abortController.signal.aborted) {
            window.location.href = '/';
          }
          return;
        }

        if (abortController.signal.aborted) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          if (!abortController.signal.aborted) {
            window.location.href = '/';
            toast.error('You do not have permission to access the admin area');
          }
          return;
        }

        if (!abortController.signal.aborted) {
          setIsAdmin(true);
          setAuthLoading(false);
          fetchData();
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error checking admin status:', error);
          window.location.href = '/';
        }
      }
    };

    checkAdminStatus();

    return () => {
      abortController.abort();
    };
  }, [isClient]);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching trending products data...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Check if admin_trending_products table exists
      const { data: tableTest, error: tableError } = await supabaseClient
        .from('admin_trending_products')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('relation "public.admin_trending_products" does not exist')) {
        console.log('❌ admin_trending_products table does not exist!');
        toast.error('Database migration required: Please run the SQL migration for trending products in your Supabase dashboard');
        setTrendingProducts([]);
        setAvailableArtworks([]);
        setLoading(false);
        return;
      }

      // Fetch trending products with environment-aware fallback
      let trendingData = [];

      // Determine environment based on window location for more reliable client-side detection
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      console.log(`⭐ Trending Products - Environment detected: ${isLocalhost ? 'development' : 'production'}`);

      if (isLocalhost) {
        // In development, skip Netlify function and go straight to Supabase
        console.log('🔧 Development mode: Using direct Supabase connection for trending products');
      } else {
        // In production, try Netlify function first
        console.log('🔧 Production mode: Trying Netlify function first for trending products');
        try {
          const trendingResponse = await fetch('/.netlify/functions/admin-trending-products');
          if (trendingResponse.ok) {
            trendingData = await trendingResponse.json();
            console.log('✅ Fetched trending products from Netlify function');
          }
        } catch (netlifyError) {
          console.log('❌ Netlify function failed (network or non-2xx response)');
        }
      }

      // If we don't have trending data yet (development mode or function failed), use Supabase
      if (trendingData.length === 0) {
        if (!isLocalhost) {
          console.log('❌ Netlify function failed, trying direct Supabase...');
        }

        // Use service role for admin operations to bypass RLS
        const { createClient } = await import('@supabase/supabase-js');
        const adminSupabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        const { data, error } = await adminSupabaseClient
          .from('admin_trending_products')
          .select(`
            *,
            artwork:artworks(
              id,
              title,
              artist_name,
              price,
              currency,
              description,
              category,
              status,
              artwork_images!artwork_images_artwork_id_fkey(file_path, is_primary)
            )
          `)
          .order('display_order', { ascending: true });

        if (error) throw error;
        trendingData = data || [];
        console.log('✅ Fetched trending products directly from Supabase');
      }

      setTrendingProducts(trendingData);
      await fetchAvailableArtworks();
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableArtworks = async () => {
    try {
      // Use service role for admin operations to ensure access to all approved artworks
      const { createClient } = await import('@supabase/supabase-js');
      const adminSupabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data: artworks, error } = await adminSupabaseClient
        .from('artworks')
        .select(`
          id,
          title,
          artist_name,
          price,
          currency,
          description,
          category,
          status,
          artwork_images!artwork_images_artwork_id_fkey(file_path, is_primary)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process artworks to get primary images
      const processedArtworks = (artworks || []).map((artwork: any) => {
        const primaryImage = artwork.artwork_images?.find((img: any) => img.is_primary);
        const allImages = artwork.artwork_images?.map((img: any) => img.file_path) || [];

        return {
          id: artwork.id,
          title: artwork.title,
          artist_name: artwork.artist_name,
          price: artwork.price,
          currency: artwork.currency,
          description: artwork.description,
          category: artwork.category,
          status: artwork.status,
          primary_image_path: primaryImage?.file_path,
          image_paths: allImages
        };
      });

      setAvailableArtworks(processedArtworks);
    } catch (error) {
      console.error('Error fetching available artworks:', error);
    }
  };

  const addTrendingProduct = async (artworkId: string) => {
    try {
      // Check if already exists
      const existing = trendingProducts.find(tp => tp.artwork_id === artworkId);
      if (existing) {
        toast.error('This artwork is already in trending products');
        return;
      }

      // Check if we have 8 already
      if (trendingProducts.length >= 8) {
        toast.error('Maximum of 8 trending products allowed');
        return;
      }

      const nextOrder = trendingProducts.length + 1;

      console.log('📡 Adding trending product...');

      // Determine environment and use appropriate method
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        console.log('🔧 Development mode: Using direct Supabase connection');
      } else {
        console.log('🔧 Production mode: Trying Netlify function first');
        try {
          const response = await fetch('/.netlify/functions/admin-trending-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artwork_id: artworkId,
              display_order: nextOrder
            })
          });
          if (response.ok) {
            const result = await response.json();
            setTrendingProducts([...trendingProducts, result]);
            toast.success('Trending product added successfully');
            return;
          }
        } catch (netlifyError) {
          console.log('❌ Netlify function failed (network or non-2xx response)');
        }
      }

      // Fallback to direct Supabase (development mode or function failed)
      if (!isLocalhost) {
        console.log('❌ Netlify function failed, trying direct Supabase...');
      }

      // Use service role for admin operations to bypass RLS
      const { createClient } = await import('@supabase/supabase-js');

      // Debug: Check what keys are being used
      console.log('🔑 Service Role Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔑 Anon Key fallback:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('🔑 Actual Service Role Key length:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0);
      console.log('🔑 Actual Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data, error } = await supabaseClient
        .from('admin_trending_products')
        .insert([{
          artwork_id: artworkId,
          display_order: nextOrder
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw new Error(`Database error: ${error.message || 'Unknown database error'}`);
      }

      setTrendingProducts([...trendingProducts, data]);
      toast.success('Trending product added successfully');
      fetchData();
    } catch (error) {
      console.error('❌ Error adding trending product:', error);
      toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const removeTrendingProduct = async (id: string) => {
    try {
      console.log('🗑️ Removing trending product:', id);

      // Determine environment and use appropriate method
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        console.log('🔧 Development mode: Using direct Supabase connection');
      } else {
        console.log('🔧 Production mode: Trying Netlify function first');
        try {
          const response = await fetch('/.netlify/functions/admin-trending-products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (response.ok) {
            setTrendingProducts(trendingProducts.filter(tp => tp.id !== id));
            toast.success('Trending product removed successfully');
            return;
          }
        } catch (netlifyError) {
          console.log('❌ Netlify function failed (network or non-2xx response)');
        }
      }

      // Fallback to direct Supabase (development mode or function failed)
      if (!isLocalhost) {
        console.log('❌ Netlify function failed, trying direct Supabase...');
      }

      // Use service role for admin operations to bypass RLS
      const { createClient } = await import('@supabase/supabase-js');

      // Debug: Check what keys are being used
      console.log('🔑 Service Role Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔑 Anon Key fallback:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('🔑 Actual Service Role Key length:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0);
      console.log('🔑 Actual Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { error } = await supabaseClient
        .from('admin_trending_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrendingProducts(trendingProducts.filter(tp => tp.id !== id));
      toast.success('Trending product removed successfully');
      fetchData();
    } catch (error) {
      console.error('❌ Error removing trending product:', error);
      toast.error(`Failed to remove product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateDisplayOrder = async (id: string, newOrder: number) => {
    try {
      console.log('🔄 Updating display order:', id, newOrder);

      // Determine environment and use appropriate method
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        console.log('🔧 Development mode: Using direct Supabase connection');
      } else {
        console.log('🔧 Production mode: Trying Netlify function first');
        try {
          const response = await fetch('/.netlify/functions/admin-trending-products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              display_order: newOrder
            })
          });
          if (response.ok) {
            const result = await response.json();
            setTrendingProducts(trendingProducts.map(tp =>
              tp.id === id ? result : tp
            ));
            toast.success('Display order updated successfully');
            return;
          }
        } catch (netlifyError) {
          console.log('❌ Netlify function failed (network or non-2xx response)');
        }
      }

      // Fallback to direct Supabase (development mode or function failed)
      // Use service role for admin operations to bypass RLS
      const { createClient } = await import('@supabase/supabase-js');

      // Debug: Check what keys are being used
      console.log('🔑 Service Role Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔑 Anon Key fallback:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('🔑 Actual Service Role Key length:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0);
      console.log('🔑 Actual Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data, error } = await supabaseClient
        .from('admin_trending_products')
        .update({ display_order: newOrder })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTrendingProducts(trendingProducts.map(tp =>
        tp.id === id ? data : tp
      ));
      toast.success('Display order updated successfully');
      fetchData();
    } catch (error) {
      console.error('❌ Error updating display order:', error);
      toast.error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      console.log('🔄 Toggling active status:', id, !isActive);

      // Determine environment and use appropriate method
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        console.log('🔧 Development mode: Using direct Supabase connection');
      } else {
        console.log('🔧 Production mode: Trying Netlify function first');
        try {
          const response = await fetch('/.netlify/functions/admin-trending-products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              is_active: !isActive
            })
          });
          if (response.ok) {
            const result = await response.json();
            setTrendingProducts(trendingProducts.map(tp =>
              tp.id === id ? result : tp
            ));
            toast.success(`Trending product ${!isActive ? 'activated' : 'deactivated'} successfully`);
            return;
          }
        } catch (netlifyError) {
          console.log('❌ Netlify function failed (network or non-2xx response)');
        }
      }

      // Fallback to direct Supabase (development mode or function failed)
      if (!isLocalhost) {
        console.log('❌ Netlify function failed, trying direct Supabase...');
      }

      // Use service role for admin operations to bypass RLS
      const { createClient } = await import('@supabase/supabase-js');

      // Debug: Check what keys are being used
      console.log('🔑 Service Role Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔑 Anon Key fallback:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('🔑 Actual Service Role Key length:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0);
      console.log('🔑 Actual Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data, error } = await supabaseClient
        .from('admin_trending_products')
        .update({ is_active: !isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTrendingProducts(trendingProducts.map(tp =>
        tp.id === id ? data : tp
      ));
      toast.success(`Trending product ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('❌ Error toggling active status:', error);
      toast.error(`Failed to toggle status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filter available artworks based on search and category
  const filteredArtworks = availableArtworks.filter(artwork => {
    const matchesSearch = searchQuery === '' ||
      artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artwork.artist_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || artwork.category === selectedCategory;

    // Exclude artworks already in trending
    const notInTrending = !trendingProducts.some(tp => tp.artwork_id === artwork.id);

    return matchesSearch && matchesCategory && notInTrending;
  });

  if (!isClient || authLoading || !isAdmin) {
    return <div className="container mx-auto py-8">Loading admin panel...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Trending Products Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Trending Products */}
        <Card>
          <CardHeader>
            <CardTitle>Current Trending Products ({trendingProducts.length}/8)</CardTitle>
            <CardDescription>
              These products will be displayed on the homepage. Drag to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading trending products...</div>
            ) : trendingProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No trending products selected. Add some from the available products list.
              </div>
            ) : (
              <div className="space-y-4">
                {trendingProducts.map((tp, index) => (
                  <div key={tp.id} className="border rounded-lg p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">#{tp.display_order}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {tp.artwork && (
                        <div className="flex gap-4">
                          <div className="w-16 h-16 relative rounded overflow-hidden bg-gray-100">
                            {tp.artwork.primary_image_path ? (
                              <SupabaseImage
                                src={tp.artwork.primary_image_path}
                                alt={tp.artwork.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <span className="text-xs text-gray-500">No image</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium">{tp.artwork.title}</h4>
                            <p className="text-sm text-gray-600">by {tp.artwork.artist_name}</p>
                            <p className="text-sm font-medium text-green-600">
                              {formatPrice(tp.artwork.price, tp.artwork.currency)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(tp.id, tp.is_active)}
                        className="flex items-center gap-1"
                      >
                        {tp.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {tp.is_active ? 'Hide' : 'Show'}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTrendingProduct(tp.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Products */}
        <Card>
          <CardHeader>
            <CardTitle>Add Products to Trending</CardTitle>
            <CardDescription>
              Select from approved artworks to add to your trending products list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search artworks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={selectedCategory} onChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="paintings">Paintings</SelectItem>
                    <SelectItem value="sculptures">Sculptures</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="mixed-media">Mixed Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Artworks */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredArtworks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No artworks match your search criteria.'
                    : 'No available artworks to add.'}
                </div>
              ) : (
                filteredArtworks.map((artwork) => (
                  <div key={artwork.id} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-100">
                      {artwork.primary_image_path ? (
                        <SupabaseImage
                          src={artwork.primary_image_path}
                          alt={artwork.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{artwork.title}</h4>
                      <p className="text-xs text-gray-600">by {artwork.artist_name}</p>
                      <p className="text-xs text-green-600 font-medium">
                        {formatPrice(artwork.price, artwork.currency)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => addTrendingProduct(artwork.id)}
                      disabled={trendingProducts.length >= 8}
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>

            {trendingProducts.length >= 8 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Maximum of 8 trending products reached. Remove some to add more.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
