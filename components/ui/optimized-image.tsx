'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  lowQualitySrc?: string;
  blurhash?: string;
  aspectRatio?: number;
  className?: string;
  containerClassName?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackSrc = '/images/placeholder.webp',
  lowQualitySrc,
  blurhash,
  aspectRatio,
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(lowQualitySrc);
  
  // Set the main image src once the component mounts
  useEffect(() => {
    if (!lowQualitySrc) {
      setCurrentSrc(typeof src === 'string' ? src : undefined);
    }
  }, [src, lowQualitySrc]);

  const handleLoad = () => {
    // If we're using a low quality preview, switch to the high quality image
    if (lowQualitySrc && isLoading) {
      setCurrentSrc(typeof src === 'string' ? src : undefined);
    }
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Calculate aspect ratio styles if provided
  const aspectRatioStyle = aspectRatio 
    ? { 
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
        position: 'relative' as const,
      } 
    : undefined;

  return (
    <div 
      className={cn(
        'overflow-hidden', 
        isLoading && 'animate-pulse bg-gray-200',
        containerClassName
      )}
      style={aspectRatioStyle}
    >
      <Image
        src={hasError ? fallbackSrc : (currentSrc || (typeof src === 'string' ? src : fallbackSrc))}
        alt={alt}
        width={width}
        height={height}
        onLoadingComplete={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-500',
          isLoading && lowQualitySrc ? 'opacity-60 blur-sm' : 'opacity-100 blur-0',
          className
        )}
        priority={props.priority}
        quality={props.quality || 85}
        loading={props.loading || 'lazy'}
        sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        {...props}
      />
    </div>
  );
} 