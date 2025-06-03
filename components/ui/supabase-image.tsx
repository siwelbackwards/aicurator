'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { formatSupabaseUrl } from '@/lib/utils';

interface SupabaseImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src?: string;
  fallbackSrc?: string;
  timeout?: number;
}

/**
 * A component for displaying images from Supabase storage with proper error handling
 * and fallback to Unsplash images if needed
 */
export function SupabaseImage({
  src,
  fallbackSrc = '/placeholder.svg',
  alt = 'Image',
  timeout = 5000,
  ...props
}: SupabaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorLogged, setErrorLogged] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageLoadedRef = useRef(false);
  
  // Generate a random Unsplash image as second fallback
  const getUnsplashFallback = () => {
    // List of categories for relevant art images
    const categories = ['art', 'painting', 'abstract', 'modern-art', 'photography'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    return `https://source.unsplash.com/random/800x800/?${randomCategory}`;
  };
  
  // Initialize image only on client side to avoid SSR issues
  useEffect(() => {
    // Clean up previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset loading state
    setIsLoading(true);
    setHasError(false);
    setErrorLogged(false);
    imageLoadedRef.current = false;
    
    if (!src) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No src provided, using fallback');
      }
      setImgSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }
    
    try {
      // Format the URL properly using our utility
      const formattedUrl = formatSupabaseUrl(src);
      
      // Debug log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Original src:', src);
        console.log('Formatted image URL:', formattedUrl);
      }
      
      // Check if URL is valid before setting it
      if (formattedUrl && formattedUrl.length > 10) {
        setImgSrc(formattedUrl);
        
        // Set up timeout to prevent infinite loading
        timeoutRef.current = setTimeout(() => {
          if (!imageLoadedRef.current) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Image loading timed out after ${timeout}ms: ${src}`);
            }
            handleError();
          }
        }, timeout);
      } else {
        // More detailed warning for debugging
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Invalid image URL after formatting: "${formattedUrl}" from original "${src}"`);
        }
        setImgSrc(fallbackSrc);
      }
    } catch (error) {
      console.error('Error constructing image URL:', error);
      setImgSrc(fallbackSrc);
    } finally {
      setIsLoading(false);
    }
    
    // Clear timeout on cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [src, fallbackSrc, timeout]);

  // Handle image load error with better fallback strategy
  const handleError = () => {
    // Only log error once to prevent console spam
    if (!errorLogged) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Image failed to load: ${imgSrc} (original: ${src})`);
      }
      setErrorLogged(true);
    }
    
    if (!hasError) {
      // Try Unsplash as a second fallback for a nicer user experience
      const unsplashFallback = getUnsplashFallback();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to Unsplash image');
      }
      
      setImgSrc(unsplashFallback);
      setHasError(true);
    } else {
      // If Unsplash also fails, use our SVG placeholder as final fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Fallback image also failed, using placeholder');
      }
      setImgSrc(fallbackSrc);
    }
  };

  // Handle successful image load
  const handleImageLoad = () => {
    // Mark image as loaded to prevent timeout
    imageLoadedRef.current = true;
    
    // Clear the timeout since image loaded successfully
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
      onLoad={handleImageLoad}
      unoptimized={true} // Skip Next.js image optimization to avoid additional issues
    />
  );
} 