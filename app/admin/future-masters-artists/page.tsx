'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import ImageInput from '@/components/admin/image-input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
  created_at: string;
  updated_at: string;
}

interface ArtistFormData {
  name: string;
  location: string;
  specialty: string;
  description: string;
  image_url: string;
  exhibitions: number;
  collections: number;
  awards: number;
  recent_work_1_url: string;
  recent_work_2_url: string;
  artist_name_for_search: string;
  is_active: boolean;
  display_order: number;
}

export default function FutureMastersArtistsAdmin() {
  const [artists, setArtists] = useState<FutureMastersArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<FutureMastersArtist | null>(null);
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    location: '',
    specialty: '',
    description: '',
    image_url: '',
    exhibitions: 0,
    collections: 0,
    awards: 0,
    recent_work_1_url: '',
    recent_work_2_url: '',
    artist_name_for_search: '',
    is_active: true,
    display_order: 0
  });

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
          fetchArtists();
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

  const fetchArtists = async () => {
    try {
      console.log('🔍 Fetching artists...');
      console.log('📋 Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      });

      // Try the Netlify function first
      let response = await fetch('/.netlify/functions/admin-future-masters-artists');
      console.log('📡 Netlify function response status:', response.status);

      if (!response.ok) {
        console.log('❌ Netlify function failed, trying direct Supabase...');

        // Fallback to direct Supabase call for development
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase environment variables');
        }

        console.log('🔗 Creating Supabase client...');
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('📊 Querying future_masters_artists table...');
        const { data, error } = await supabase
          .from('future_masters_artists')
          .select('*')
          .order('display_order', { ascending: true });

        console.log('📊 Query result:', { data: data?.length, error });

        if (error) {
          console.error('❌ Supabase query error:', error);
          throw error;
        }

        setArtists(data || []);
        console.log('✅ Fetched artists directly from Supabase:', data?.length);
      } else {
        const data = await response.json();
        setArtists(data);
        console.log('✅ Fetched artists from Netlify function:', data.length);
      }
    } catch (error) {
      console.error('❌ Error fetching artists:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast.error(`Failed to load artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('💾 Saving artist...', { editingArtist: !!editingArtist, formData });

      const url = editingArtist
        ? '/.netlify/functions/admin-future-masters-artists'
        : '/.netlify/functions/admin-future-masters-artists';

      const method = editingArtist ? 'PUT' : 'POST';
      const body = editingArtist
        ? { ...formData, id: editingArtist.id }
        : formData;

      console.log('📡 Attempting to save via Netlify function...');
      let response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log('📡 Netlify function response status:', response.status);

      if (!response.ok) {
        console.log('❌ Netlify function failed, trying direct Supabase...');

        // Fallback to direct Supabase call for development
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let result;
        if (editingArtist) {
          result = await supabase
            .from('future_masters_artists')
            .update(body)
            .eq('id', editingArtist.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('future_masters_artists')
            .insert([body])
            .select()
            .single();
        }

        if (result.error) throw result.error;
        console.log('✅ Artist saved directly to Supabase:', result.data);
      } else {
        const data = await response.json();
        console.log('✅ Artist saved via Netlify function:', data);
      }

      toast.success(editingArtist ? 'Artist updated successfully' : 'Artist created successfully');
      resetForm();
      fetchArtists();
    } catch (error) {
      console.error('❌ Error saving artist:', error);
      toast.error(`Failed to save artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (artist: FutureMastersArtist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      location: artist.location,
      specialty: artist.specialty,
      description: artist.description,
      image_url: artist.image_url,
      exhibitions: artist.exhibitions,
      collections: artist.collections,
      awards: artist.awards,
      recent_work_1_url: artist.recent_work_1_url || '',
      recent_work_2_url: artist.recent_work_2_url || '',
      artist_name_for_search: artist.artist_name_for_search,
      is_active: artist.is_active,
      display_order: artist.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (artist: FutureMastersArtist) => {
    if (!confirm(`Are you sure you want to delete ${artist.name}?`)) return;

    try {
      console.log('🗑️ Deleting artist:', artist.id);

      let response = await fetch('/.netlify/functions/admin-future-masters-artists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: artist.id })
      });

      if (!response.ok) {
        console.log('❌ Netlify function failed, trying direct Supabase...');

        // Fallback to direct Supabase call
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase
          .from('future_masters_artists')
          .delete()
          .eq('id', artist.id);

        if (error) throw error;
        console.log('✅ Artist deleted directly from Supabase');
      } else {
        console.log('✅ Artist deleted via Netlify function');
      }

      toast.success('Artist deleted successfully');
      fetchArtists();
    } catch (error) {
      console.error('❌ Error deleting artist:', error);
      toast.error(`Failed to delete artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setEditingArtist(null);
    setFormData({
      name: '',
      location: '',
      specialty: '',
      description: '',
      image_url: '',
      exhibitions: 0,
      collections: 0,
      awards: 0,
      recent_work_1_url: '',
      recent_work_2_url: '',
      artist_name_for_search: '',
      is_active: true,
      display_order: 0
    });
    setShowForm(false);
  };

  const toggleActive = async (artist: FutureMastersArtist) => {
    try {
      console.log('🔄 Toggling artist active status:', artist.id, !artist.is_active);

      let response = await fetch('/.netlify/functions/admin-future-masters-artists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: artist.id,
          is_active: !artist.is_active
        })
      });

      if (!response.ok) {
        console.log('❌ Netlify function failed, trying direct Supabase...');

        // Fallback to direct Supabase call
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase
          .from('future_masters_artists')
          .update({ is_active: !artist.is_active })
          .eq('id', artist.id);

        if (error) throw error;
        console.log('✅ Artist status updated directly in Supabase');
      } else {
        console.log('✅ Artist status updated via Netlify function');
      }

      toast.success(`Artist ${!artist.is_active ? 'activated' : 'deactivated'}`);
      fetchArtists();
    } catch (error) {
      console.error('❌ Error updating artist status:', error);
      toast.error(`Failed to update artist status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
        <h1 className="text-3xl font-bold">Future Masters Artists Management</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Manage the artists displayed on the Future Masters page. These artists will be shown to all users.
        </p>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Artist
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingArtist ? 'Edit Artist' : 'Add New Artist'}</CardTitle>
            <CardDescription>
              Fill in the artist details below. The artist will be displayed on the Future Masters page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="artist_name_for_search">Search Name *</Label>
                  <Input
                    id="artist_name_for_search"
                    value={formData.artist_name_for_search}
                    onChange={(e) => setFormData({ ...formData, artist_name_for_search: e.target.value })}
                    placeholder="Name to use when searching for artworks"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <ImageInput
                label="Profile Image"
                value={formData.image_url}
                onChange={(value) => setFormData({ ...formData, image_url: value })}
                placeholder="https://example.com/image.jpg"
                required
                bucket="artwork-images"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageInput
                  label="Recent Work 1"
                  value={formData.recent_work_1_url}
                  onChange={(value) => setFormData({ ...formData, recent_work_1_url: value })}
                  placeholder="https://example.com/work1.jpg"
                  bucket="artwork-images"
                />
                <ImageInput
                  label="Recent Work 2"
                  value={formData.recent_work_2_url}
                  onChange={(value) => setFormData({ ...formData, recent_work_2_url: value })}
                  placeholder="https://example.com/work2.jpg"
                  bucket="artwork-images"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="exhibitions">Exhibitions</Label>
                  <Input
                    id="exhibitions"
                    type="number"
                    value={formData.exhibitions}
                    onChange={(e) => setFormData({ ...formData, exhibitions: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="collections">Collections</Label>
                  <Input
                    id="collections"
                    type="number"
                    value={formData.collections}
                    onChange={(e) => setFormData({ ...formData, collections: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="awards">Awards</Label>
                  <Input
                    id="awards"
                    type="number"
                    value={formData.awards}
                    onChange={(e) => setFormData({ ...formData, awards: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible on public page)</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingArtist ? 'Update Artist' : 'Create Artist'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Artists ({artists.length})</CardTitle>
          <CardDescription>
            Current artists displayed on the Future Masters page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading artists...</div>
          ) : artists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No artists found. Click "Add New Artist" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {artists.map((artist) => (
                <div key={artist.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{artist.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        artist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {artist.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {artist.location} · {artist.specialty}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Search as: "{artist.artist_name_for_search}"
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {artist.description}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Exhibitions: {artist.exhibitions}</span>
                      <span>Collections: {artist.collections}</span>
                      <span>Awards: {artist.awards}</span>
                      <span>Order: {artist.display_order}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(artist)}
                      className="flex items-center gap-1"
                    >
                      {artist.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {artist.is_active ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(artist)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(artist)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
