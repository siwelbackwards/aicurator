import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if an image URL exists and is accessible
 * @param url The image URL to check
 * @returns True if the image exists and is accessible
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    console.error(`Error checking image URL ${url}:`, error);
    return false;
  }
}

// Create a cache for URL formatting outside the function
const urlFormatCache = new Map<string, string>();

/**
 * Converts a possibly malformed Supabase storage URL to a properly formatted one
 * @param url The URL or path to fix
 * @returns A properly formatted Supabase storage URL
 */
export function formatSupabaseUrl(url: string): string {
  if (!url) return '';
  
  // If we've already formatted this URL, return from cache
  if (urlFormatCache.has(url)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`formatSupabaseUrl - Cache hit for: "${url}"`);
    }
    return urlFormatCache.get(url) as string;
  }
  
  // If already a full URL, cache it and return it
  if (url.startsWith('https://')) {
    if (url.includes('/storage/v1/object/public/')) {
      // This is already a properly formatted Supabase URL, cache and return
      urlFormatCache.set(url, url);
      return url;
    }
  }
  
  // Handle data URLs directly
  if (url.startsWith('data:')) {
    urlFormatCache.set(url, url);
    return url;
  }
  
  try {
    // Use the environment variable or fallback
    const supabaseUrl = typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_SUPABASE_URL 
      ? window.ENV.NEXT_PUBLIC_SUPABASE_URL 
      : process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
    
    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`formatSupabaseUrl - Input path: "${url}"`);
    }
    
    // Fix common issues with Supabase storage paths
    let cleanPath = url;
    
    // Create an array of known bucket names to check against
    const bucketNames = ['artwork-images', 'avatars', 'profiles'];
    
    // Remove any leading slash
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Fix duplicate bucket paths like "artwork-images/artwork-images"
    for (const bucket of bucketNames) {
      // Match patterns like "artwork-images/artwork-images/" (with the duplicate at the start)
      const duplicatePattern = new RegExp(`^${bucket}/${bucket}(/|$)`);
      if (duplicatePattern.test(cleanPath)) {
        cleanPath = cleanPath.replace(duplicatePattern, `${bucket}$1`);
        if (process.env.NODE_ENV === 'development') {
          console.log(`formatSupabaseUrl - Fixed duplicate bucket: "${cleanPath}"`);
        }
      }
    }
    
    // Check if path includes a bucket name already
    const hasBucket = bucketNames.some(bucket => 
      cleanPath.startsWith(bucket + '/') || cleanPath === bucket
    );
    
    // Add default bucket if needed
    if (!hasBucket) {
      cleanPath = `artwork-images/${cleanPath}`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`formatSupabaseUrl - Added default bucket: "${cleanPath}"`);
      }
    }
    
    // Construct final URL
    const finalUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`formatSupabaseUrl - Final URL: "${finalUrl}"`);
    }
    
    // Cache the result
    urlFormatCache.set(url, finalUrl);
    
    return finalUrl;
  } catch (error) {
    console.error('Error in formatSupabaseUrl:', error);
    return url; // Return original URL if formatting fails
  }
}