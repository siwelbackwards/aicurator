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

/**
 * Converts a possibly malformed Supabase storage URL to a properly formatted one
 * @param url The URL or path to fix
 * @returns A properly formatted Supabase storage URL
 */
export function formatSupabaseUrl(url: string): string {
  if (!url) return '';
  
  // If already a full URL, return it
  if (url.startsWith('https://')) return url;
  
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpzzmpgbyzcqbwkaaqdy.supabase.co';
  
  // Fix common issues with Supabase storage paths
  let cleanPath = url;
  
  // Remove duplicate path segments
  cleanPath = cleanPath.replace(/artwork-images\/artwork-images/g, 'artwork-images');
  
  // Ensure no leading slash for bucket path portions
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // For Supabase storage, use the storage API pattern
  if (cleanPath.includes('artwork-images') || cleanPath.includes('storage/')) {
    return `${baseUrl}/storage/v1/object/public/${cleanPath}`;
  }
  
  // For other paths, simple join
  return `${baseUrl}/${cleanPath}`;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}