'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface ArtworkImageUploadProps {
  artworkId: string;
  onUploadComplete: () => void;
}

export default function ArtworkImageUpload({ artworkId, onUploadComplete }: ArtworkImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{path: string, isPrimary: boolean}[]>([]);

  // Fetch existing images on load
  useEffect(() => {
    if (artworkId !== 'new') {
      fetchExistingImages();
    }
  }, [artworkId]);

  const fetchExistingImages = async () => {
    try {
      const { data, error } = await supabase
        .from('artwork_images')
        .select('*')
        .eq('artwork_id', artworkId);
      
      if (error) throw error;
      
      if (data) {
        setUploadedImages(data.map((img: { file_path: string; is_primary: boolean }) => ({
          path: img.file_path,
          isPrimary: img.is_primary
        })));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

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

      const filePath = `artwork-${artworkId}-${isPrimary ? 'primary' : 'secondary'}-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage.from('artworks').upload(
        filePath,
        file,
        {
          cacheControl: '3600',
          upsert: true
        }
      );

      if (storageError) throw storageError;

      // If this is a primary image and there's already a primary, update the existing one
      if (isPrimary && artworkId !== 'new') {
        const { error: updateError } = await supabase
          .from('artwork_images')
          .update({ is_primary: false })
          .eq('artwork_id', artworkId)
          .eq('is_primary', true);
        
        if (updateError) console.error('Error updating primary status:', updateError);
      }

      // Add to the artwork_images table if artworkId is not 'new'
      if (artworkId !== 'new') {
        await supabase
          .from('artwork_images')
          .insert({
            artwork_id: artworkId,
            file_path: filePath,
            is_primary: isPrimary
          });
      }

      // Update local state
      setUploadedImages(prev => [...prev, { path: filePath, isPrimary }]);
      
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

      {/* Preview of uploaded images */}
      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Uploaded Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative border rounded p-1">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artworks/${img.path}`}
                    alt={`Uploaded ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
                {img.isPrimary && (
                  <span className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 