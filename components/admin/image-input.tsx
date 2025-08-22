"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Upload, Link, Trash2, Image as ImageIcon } from 'lucide-react';
import { SupabaseImage } from '@/components/ui/supabase-image';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  bucket?: string;
}

export default function ImageInput({
  label,
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  required = false,
  bucket = "artwork-images"
}: ImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileSize = file.size / 1024 / 1024; // size in MB

      // Validate file type
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt?.toLowerCase() || '')) {
        toast.error('Please upload an image file (jpg, jpeg, png, or webp)');
        return;
      }

      // Validate file size (max 10MB)
      if (fileSize > 10) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      const fileName = `future-masters-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (storageError) throw storageError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      onChange(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`${label}-input`}>
        {label} {required && '*'}
      </Label>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-2">
          <Input
            id={`${label}-input`}
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            required={required}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {value && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Preview:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </Button>
          </div>
          <div className="border rounded-lg p-2 bg-gray-50">
            <div className="relative aspect-video w-full max-w-sm mx-auto overflow-hidden rounded">
              {value.startsWith('http') ? (
                <SupabaseImage
                  src={value}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="384px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Invalid image URL</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 break-all">{value}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
