'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { formatSupabaseUrl } from '@/lib/utils';

interface SupabaseImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src?: string;
  fallbackSrc?: string;
}

/**
 * A component for displaying images from Supabase storage with proper error handling
 * and fallback to Unsplash images if needed
 */
export function SupabaseImage({
  src,
  fallbackSrc = '/placeholder.svg',
  alt = 'Image',
  ...props
}: SupabaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Generate a random Unsplash image as second fallback
  const getUnsplashFallback = () => {
    // List of categories for relevant art images
    const categories = ['art', 'painting', 'abstract', 'modern-art', 'photography'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    return `https://source.unsplash.com/random/800x800/?${randomCategory}`;
  };
  
  // Initialize image only on client side to avoid SSR issues
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    if (!src) {
      console.log('No src provided, using fallback');
      setImgSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }
    
    try {
      // Format the URL properly using our utility
      const formattedUrl = formatSupabaseUrl(src);
      console.log('Formatted image URL:', formattedUrl);
      
      // Check if URL is valid before setting it
      if (formattedUrl) {
        setImgSrc(formattedUrl);
      } else {
        console.warn('Invalid image URL after formatting, using fallback');
        setImgSrc(fallbackSrc);
      }
    } catch (error) {
      console.error('Error constructing image URL:', error);
      setImgSrc(fallbackSrc);
    } finally {
      setIsLoading(false);
    }
  }, [src, fallbackSrc]);

  // Handle image load error with better fallback strategy
  const handleError = () => {
    console.error(`Image failed to load: ${imgSrc}`);
    
    if (!hasError) {
      // Try Unsplash as a second fallback for a nicer user experience
      const unsplashFallback = getUnsplashFallback();
      console.log('Falling back to Unsplash image:', unsplashFallback);
      
      setImgSrc(unsplashFallback);
      setHasError(true);
    } else {
      // If Unsplash also fails, use our SVG placeholder as final fallback
      console.log('Fallback image also failed, using placeholder');
      setImgSrc(fallbackSrc);
    }
  };

  // Show loading state or placeholder while the image is being prepared
  if (isLoading) {
    return (
      <div
        className="bg-gray-200 animate-pulse"
        style={{
          width: props.width || '100%',
          height: props.height || '100%',
          ...(props.fill ? { position: 'absolute', inset: 0 } : {})
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={true} // Skip Next.js image optimization to avoid additional issues
    />
  );
} 