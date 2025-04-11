'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SupabaseImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src?: string;
  fallbackSrc?: string;
}

/**
 * A component for displaying images from Supabase storage with proper error handling
 */
export function SupabaseImage({
  src,
  fallbackSrc = '/placeholder.webp',
  alt = 'Image',
  ...props
}: SupabaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  // Function to get a clean image URL
  const getSupabaseImageUrl = (url: string): string => {
    if (!url) return fallbackSrc;
    
    // Fix double path issue if it exists
    const cleanUrl = url.replace('/artwork-images/artwork-images/', '/artwork-images/');
    
    // Check if it's already an absolute URL with https://
    if (cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    // Handle relative URLs from Supabase storage
    if (cleanUrl.startsWith('/')) {
      // Strip leading slash if present
      const storageUrl = cleanUrl.startsWith('/storage/') 
        ? cleanUrl.substring(1) 
        : cleanUrl;
      
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${storageUrl}`;
    }
    
    // Default return the original URL
    return cleanUrl;
  };

  // Handle image load error
  const handleError = () => {
    if (!hasError) {
      console.log(`Image load error: ${imgSrc}, falling back to placeholder`);
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <Image
      {...props}
      src={getSupabaseImageUrl(imgSrc)}
      alt={alt}
      onError={handleError}
    />
  );
} 