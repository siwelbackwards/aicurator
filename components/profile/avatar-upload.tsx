"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { formatSupabaseUrl } from '@/lib/utils';
import { SupabaseImage } from '@/components/ui/supabase-image';

interface AvatarUploadProps {
  userId: string;
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
}

export default function AvatarUpload({ 
  userId, 
  url, 
  onUpload,
  size = 150 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size too large. Maximum size is 2MB.');
        return;
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Unsupported file type. Please upload JPEG, PNG, GIF, or WEBP image.');
        return;
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Use the formatSupabaseUrl utility to create a clean URL
      const avatarUrl = formatSupabaseUrl(`avatars/${filePath}`);
      
      onUpload(avatarUrl);
    } catch (error: any) {
      setError(error.message || 'Error uploading avatar');
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        className="relative rounded-full overflow-hidden border-2 border-gray-200"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {url ? (
          <SupabaseImage 
            src={url} 
            alt="Avatar" 
            className="object-cover"
            fill
            sizes={`${size}px`}
          />
        ) : (
          <div className="bg-gray-100 h-full w-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        )}
      </div>
      <div>
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
        <Label
          htmlFor="avatar"
          className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Label>
      </div>
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
    </div>
  );
} 