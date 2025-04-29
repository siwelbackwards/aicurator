'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface ArtworkImageUploadProps {
  artworkId: string;
  onUploadComplete: () => void;
}

export default function ArtworkImageUpload({ artworkId, onUploadComplete }: ArtworkImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileSize = file.size / 1024 / 1024; // size in MB

      // Validate file type
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt?.toLowerCase() || '')) {
        throw new Error('Please upload an image file (jpg, jpeg, png, or webp)');
      }

      // Validate file size (max 5MB)
      if (fileSize > 5) {
        throw new Error('Image size must be less than 5MB');
      }

      await supabase.storage.from('artworks').upload(
        `artwork-${artworkId}-${isPrimary ? 'primary' : 'secondary'}-${Date.now()}.${fileExt}`,
        file,
        {
          cacheControl: '3600',
          upsert: true
        }
      );
      toast.success('Image uploaded successfully');
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPrimary"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isPrimary" className="text-sm text-gray-700">
          Set as primary image
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
} 