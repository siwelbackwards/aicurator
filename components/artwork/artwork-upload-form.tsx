'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, uploadArtworkImage } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ArtworkImageUpload from './artwork-image-upload';

export default function ArtworkUploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    dimensions: '',
    year: '',
    materials: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload artwork');
      }

      // Create artwork record
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          dimensions: formData.dimensions,
          year: parseInt(formData.year),
          materials: formData.materials,
          user_id: user.id,
          status: 'pending', // Set initial status as pending
        })
        .select()
        .single();

      if (artworkError) {
        throw artworkError;
      }

      toast.success('Artwork uploaded successfully!');
      router.push('/dashboard'); // Redirect to dashboard or artwork page
    } catch (error) {
      console.error('Error uploading artwork:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload artwork');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Enter artwork title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe your artwork"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (£)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            placeholder="e.g., Painting, Sculpture"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input
            id="dimensions"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleChange}
            placeholder="e.g., 24x36 inches"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year Created</Label>
          <Input
            id="year"
            name="year"
            type="number"
            value={formData.year}
            onChange={handleChange}
            placeholder="e.g., 2023"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="materials">Materials</Label>
        <Input
          id="materials"
          name="materials"
          value={formData.materials}
          onChange={handleChange}
          placeholder="e.g., Oil on canvas, Bronze"
        />
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ArtworkImageUpload
          artworkId="new" // This will be updated after artwork creation
          onUploadComplete={() => {
            toast.success('Image uploaded successfully');
          }}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Artwork'}
      </Button>
    </form>
  );
} 