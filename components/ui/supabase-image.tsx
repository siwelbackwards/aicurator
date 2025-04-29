'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { formatSupabaseUrl } from '@/lib/supabase';

interface SupabaseImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackSrc?: string;
}

/**
 * A component for displaying images from Supabase storage with proper error handling
 * and fallback to Unsplash images if needed
 */
export default function SupabaseImage({
  src,
  fallbackSrc = '/placeholder.svg',
  ...props
}: SupabaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(formatSupabaseUrl(src));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setImgSrc(formatSupabaseUrl(src));
    setIsLoading(true);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!error) {
      setError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative ${props.className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      <Image
        {...props}
        src={imgSrc}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${props.className || ''}`}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  );
} 