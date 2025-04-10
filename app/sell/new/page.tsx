"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface ImageFile {
  file: File;
  preview: string;
  primary: boolean;
}

interface FormData {
  title: string;
  category: string;
  artistName: string;
  description: string;
  price: string;
  location: string;
  width: string;
  height: string;
  depth: string;
  year: string;
  provenance: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: 'art',
    artistName: '',
    description: '',
    price: '',
    location: '',
    width: '',
    height: '',
    depth: '',
    year: '',
    provenance: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth?redirect=/sell/new');
        return;
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      primary: images.length === 0 // First image is primary by default
    }));

    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      primary: i === index
    }));
    setImages(newImages);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error('No authenticated user found');

      console.log('User authenticated:', session.user.id);
      
      // Try to list buckets to see if we have access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
      } else {
        console.log('Available buckets:', buckets.map(b => b.name));
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log('Attempting to upload to path:', filePath);

      // First try with a simpler path to see if it's a path structure issue
      const simplePath = `public/${fileName}`;
      console.log('Trying alternative simple path:', simplePath);

      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from('artwork-images')
          .upload(simplePath, file, {
            cacheControl: '3600',
            upsert: true // Changed to true to overwrite if file exists
          });
      } catch (e) {
        console.error('Simplified path upload failed:', e);
        
        // Try with original path as a fallback
        uploadResult = await supabase.storage
          .from('artwork-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true // Changed to true
          });
      }

      const { error: uploadError } = uploadResult;

      if (uploadError) {
        console.error('Upload error details:', JSON.stringify(uploadError));
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('artwork-images')
        .getPublicUrl(uploadResult.data?.path || simplePath);

      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');

      // Upload images
      const uploadedImages = await Promise.all(
        images.map(async (img) => ({
          url: await uploadImage(img.file),
          is_primary: img.primary
        }))
      );

      // Insert artwork
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .insert({
          user_id: session.user.id,
          title: formData.title,
          category: formData.category,
          artist_name: formData.artistName,
          description: formData.description,
          price: parseFloat(formData.price),
          location: formData.location,
          dimensions: {
            width: parseFloat(formData.width),
            height: parseFloat(formData.height),
            depth: parseFloat(formData.depth),
            unit: 'cm'
          },
          year: parseInt(formData.year),
          provenance: formData.provenance,
          status: 'pending'
        })
        .select()
        .single();

      if (artworkError) {
        console.error('Artwork insert error:', artworkError);
        throw new Error(`Failed to create artwork: ${artworkError.message}`);
      }

      // Insert images
      const { error: imagesError } = await supabase
        .from('artwork_images')
        .insert(
          uploadedImages.map(img => ({
            artwork_id: artwork.id,
            url: img.url,
            is_primary: img.is_primary
          }))
        );

      if (imagesError) {
        console.error('Images insert error:', imagesError);
        throw new Error(`Failed to save images: ${imagesError.message}`);
      }

      router.push('/sell/success');
    } catch (error) {
      console.error('Error submitting artwork:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit artwork. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">List a New Item</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter item title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="art">Art</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="accessories">Accessories</option>
                  <option value="consumables">Consumables</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Artist Name</label>
                <Input
                  required
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="Enter artist name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter item location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Width (cm)</label>
                <Input
                  type="number"
                  required
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="Width"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Height (cm)</label>
                <Input
                  type="number"
                  required
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="Height"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Depth (cm)</label>
                <Input
                  type="number"
                  required
                  value={formData.depth}
                  onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                  placeholder="Depth"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <Input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="Year of creation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Provenance</label>
              <textarea
                value={formData.provenance}
                onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                placeholder="Enter item history and ownership details"
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs ${
                        image.primary
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {image.primary ? 'Primary' : 'Set Primary'}
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <label className="border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center p-4">
                      <Upload className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Upload up to 4 images. First image will be the primary image.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading || images.length === 0}
              >
                {loading ? 'Submitting...' : 'Submit Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}