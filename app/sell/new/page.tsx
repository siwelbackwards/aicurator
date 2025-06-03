"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';
import { formatSupabaseUrl } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ImageFile {
  file: File;
  preview: string;
  primary: boolean;
  order: number;
}

interface FormData {
  title: string;
  category: string;
  artistName: string;
  description: string;
  price: string;
  currency: string;
  location: string;
  width: string;
  height: string;
  depth: string;
  measurementUnit: string;
  year: string;
  provenance: string;
  materials?: string;
}

// Add a debounce helper function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Compress images before upload
async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve) => {
    // If file is already small enough, return it as is
    if (file.size / 1024 / 1024 < maxSizeMB) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculate compression ratio
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const ratio = Math.sqrt(maxSizeBytes / file.size);
        const targetQuality = Math.min(0.95, Math.max(0.5, ratio));
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Don't resize the image, just compress it
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original file
              return;
            }
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          targetQuality
        );
      };
    };
  });
}

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: 'paintings',
    artistName: '',
    description: '',
    price: '',
    currency: 'GBP',
    location: '',
    width: '',
    height: '',
    depth: '',
    measurementUnit: 'cm',
    year: '',
    provenance: '',
    materials: ''
  });

  // Add a loadingToast state to control toast display
  const [loadingToast, setLoadingToast] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check localStorage flag to avoid redirect loops
        const userAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
        
        // Then verify with actual session
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
      if (!session) {
          console.log("Sell/new page: User not authenticated, redirecting to auth");
          // Only redirect if we're not coming from auth page or if no flag is set
          const fromAuth = document.referrer.includes('/auth');
          
          if (!userAuthenticated && !fromAuth) {
        router.push('/auth?redirect=/sell/new');
        return;
      }
          
          // If coming from auth but no session, wait briefly and check again
          if (fromAuth) {
            setTimeout(() => {
              checkAuth();
            }, 1000);
            return;
          }
        } else {
          console.log("Sell/new page: User is authenticated");
          localStorage.setItem('userAuthenticated', 'true');
        }
        
        setAuthLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
      setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Show loading toast for large batches
    let toastId: string | undefined;
    if (files.length > 3) {
      toastId = toast.loading(`Processing ${files.length} images...`);
    }

    // Process images in batches to prevent UI freeze
    const processImages = async () => {
      const newImages: ImageFile[] = [];
      const startOrder = images.length > 0 ? Math.max(...images.map(img => img.order)) + 1 : 0;
      
      for (let i = 0; i < files.length; i++) {
        try {
          // Compress the image before creating preview
          const compressedFile = await compressImage(files[i]);
          
          newImages.push({
            file: compressedFile,
            preview: URL.createObjectURL(compressedFile),
            primary: images.length === 0 && i === 0,
            order: startOrder + i
          });
          
          // Update state in batches for better UI response
          if (i % 3 === 0 || i === files.length - 1) {
            setImages(prev => [...prev, ...newImages.slice(newImages.length - (i % 3 || 3))]);
          }
        } catch (err) {
          console.error('Error processing image:', err);
        }
      }

      if (toastId) {
        toast.success('Images processed successfully', { id: toastId });
      }
    };

    processImages();
  }, [images]);

  const removeImage = useCallback((index: number) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
      
      // Update order of remaining images
      return newImages.map((img, i) => ({ ...img, order: i, primary: i === 0 }));
    });
  }, []);

  // Replace setPrimaryImage with moveImage functions for reordering
  const moveImageUp = useCallback((index: number) => {
    if (index === 0) return; // Already at the top
    
    setImages(prevImages => {
      const newImages = [...prevImages];
      // Swap with previous image
      const temp = newImages[index];
      newImages[index] = newImages[index - 1];
      newImages[index - 1] = temp;
      
      // Update order and primary status
      return newImages.map((img, i) => ({ 
      ...img,
        order: i,
        primary: i === 0
      }));
    });
  }, []);
  
  const moveImageDown = useCallback((index: number) => {
    setImages(prevImages => {
      if (index === prevImages.length - 1) return prevImages; // Already at the bottom
      
      const newImages = [...prevImages];
      // Swap with next image
      const temp = newImages[index];
      newImages[index] = newImages[index + 1];
      newImages[index + 1] = temp;
      
      // Update order and primary status
      return newImages.map((img, i) => ({ 
        ...img, 
        order: i,
        primary: i === 0
      }));
    });
  }, []);

  async function uploadImage(file: File): Promise<string> {
    try {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload images');
      }
      
      // Create a unique file name with user ID and timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      // Generate a folder structure similar to existing working images
      const userId = session.user.id.substring(0, 8); // Use first part of user ID
      const userFolderPath = `${userId}/${fileName}`;
      
      console.log('Attempting to upload to user folder path:', userFolderPath);
      
      try {
        const { data: userData, error: userError } = await supabase.storage
          .from('artwork-images')
          .upload(userFolderPath, file, {
            cacheControl: '3600',
            upsert: true // Allow overwriting
          });
        
        if (userError) {
          console.error('User folder upload failed:', userError.message);
          
          // Fall back to public folder if user folder fails
          const publicPath = `public/${fileName}`;
          console.log('Falling back to public path:', publicPath);
          
          try {
            const { data: publicData, error: publicError } = await supabase.storage
              .from('artwork-images')
              .upload(publicPath, file, {
                cacheControl: '3600',
                upsert: true
              });
              
            if (publicError) {
              console.error('Public upload failed:', publicError.message);
              throw publicError;
            }
            
            const publicUrl = formatSupabaseUrl(`artwork-images/${publicPath}`);
            console.log('Successfully uploaded to public path:', publicUrl);
            return publicUrl;
          } catch (publicUploadError) {
            console.error('All upload attempts failed:', publicUploadError);
            throw publicUploadError;
          }
        }
        
        const userUrl = formatSupabaseUrl(`artwork-images/${userFolderPath}`);
        console.log('Successfully uploaded to user path:', userUrl);
        return userUrl;
      } catch (error) {
        console.error('Error in uploadImage:', error);
        
        // Create a data URL as a last resort fallback
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('Using data URL as final fallback');
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }

  // Format price with commas
  const formatPrice = (price: string): string => {
    if (!price) return '';
    // Remove any non-numeric characters except decimal point
    const numericPrice = price.replace(/[^\d.]/g, '');
    // Format with commas
    return numericPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Unformat price to store numeric value
  const unformatPrice = (price: string): string => {
    if (!price) return '0';
    return price.replace(/,/g, '');
  };

  // Handle price input change - simplest possible approach
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and decimal point during input
    if (value === '' || /^[\d.,]*$/.test(value)) {
      // Make sure price doesn't exceed database limits when unformatted
      const unformatted = value.replace(/,/g, '');
      if (unformatted === '' || parseFloat(unformatted) < 100000000) {
      setFormData(prev => ({ ...prev, price: value }));
      } else {
        toast.error('Price cannot exceed 99,999,999.99');
      }
    }
  }, []);
  
  // Format price on blur
  const handlePriceBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    try {
      const unformatted = unformatPrice(value);
      // Double-check price limits
      if (parseFloat(unformatted) >= 100000000) {
        toast.error('Price cannot exceed 99,999,999.99');
        setFormData(prev => ({ ...prev, price: '99,999,999.99' }));
        return;
      }
      
      const formatted = formatPrice(value);
      setFormData(prev => ({ ...prev, price: formatted }));
    } catch (err) {
      console.error('Error formatting price:', err);
    }
  }, []);

  // Get display price for showing in K/M format
  const getDisplayPrice = (price: string): string => {
    if (!price) return '';
    
    try {
      const numericPrice = parseFloat(unformatPrice(price));
      if (isNaN(numericPrice)) return '';
      
      if (numericPrice >= 1000000) {
        return `${(numericPrice / 1000000).toFixed(2)}M`;
      } else if (numericPrice >= 1000) {
        return `${(numericPrice / 1000).toFixed(2)}K`;
      }
      return numericPrice.toString();
    } catch (err) {
      console.error('Error calculating display price:', err);
      return '';
    }
  };

  // Get artist label based on category
  const getArtistLabel = useMemo(() => {
    switch (formData.category) {
      case 'accessories':
        return 'Artist/Brand Name';
      case 'consumables':
        return 'Brand Name';
      case 'other':
        return 'Artist/Brand Name';
      case 'digital':
        return 'Digital Artist';
      case 'photography':
        return 'Photographer';
      default:
        return 'Artist Name';
    }
  }, [formData.category]);

  // Memoize form event handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Helper function to refresh auth session
  const refreshAuthSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      console.log('🔄 Auth session refreshed', data?.session ? 'successfully' : 'failed');
      if (error) console.error('🔄 Error refreshing session:', error);
      return !error;
    } catch (e) {
      console.error('🔄 Exception refreshing session:', e);
      return false;
    }
  };

  // Function to sign out and redirect to sign in
  const signOutAndRedirect = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth?redirect=/sell/new');
    } catch (e) {
      console.error('Error signing out:', e);
      router.push('/auth?redirect=/sell/new');
    }
  };

  // Completely new submission function with different name
  const submitArtwork = async (e: React.FormEvent) => {
    console.log('🚀🚀🚀 SUBMIT FUNCTION TRIGGERED', { 
      hasImages: images.length > 0,
      eventDetail: e.type,
      formDataKeys: Object.keys(formData)
    });
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 Starting form validation checks');
      // Basic validation
      if (images.length === 0) {
        toast.error('Please upload at least one image');
        setLoading(false);
        return;
      }
      
      if (!formData.price || isNaN(parseFloat(unformatPrice(formData.price)))) {
        toast.error('Please enter a valid price');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Checking authentication');
      // Get user session
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error('🔍 Auth error:', error);
        toast.error('Authentication error. Please sign in again.');
        router.push('/auth?redirect=/sell/new');
        setLoading(false);
        return;
      }

      console.log('🔍 Authentication successful, user ID:', data.session.user.id);
      const session = data.session;
      
      // Upload images
      console.log('🔍 Starting image upload process');
      const imageToastId = toast.loading('Uploading images...');
      
      try {
        console.log('🔍 Preparing to upload', images.length, 'images');
        // Upload all images in parallel
        const imageUploads = images.map(async (img, index) => {
          console.log(`🔍 Starting upload for image ${index + 1}`);
          try {
            const imageUrl = await uploadImage(img.file);
            console.log(`🔍 Image ${index + 1} uploaded successfully:`, imageUrl.substring(0, 50) + '...');
                return {
              url: imageUrl,
                  is_primary: img.primary,
                  display_order: img.order
                };
          } catch (err) {
            console.error(`🔍 Image ${index + 1} upload failed:`, err);
                return null;
              }
        });
        
        console.log('🔍 Waiting for all image uploads to complete');
        const uploadResults = await Promise.all(imageUploads);
        const successfulUploads = uploadResults.filter(result => result !== null);
        
        console.log('🔍 Upload results:', { 
          total: uploadResults.length, 
          successful: successfulUploads.length 
        });
        
        if (successfulUploads.length === 0) {
          console.error('🔍 All uploads failed');
          toast.error('Failed to upload any images', { id: imageToastId });
          setLoading(false);
          return;
        }
        
        toast.success(`Uploaded ${successfulUploads.length} images`, { id: imageToastId });
        
        // Database operations toast
        console.log('🔍 Starting database operations');
        const dbToastId = toast.loading('Saving your artwork...');
        
        try {
          // Parse numeric values
          console.log('🔍 Parsing form data');
          const price = parseFloat(unformatPrice(formData.price));
          
          // Check if price exceeds database limits
          if (price >= 100000000) {
            toast.error('Price is too large. Maximum allowed is 99,999,999.99', { id: dbToastId });
            setLoading(false);
            return;
          }

          const width = parseFloat(formData.width || '0');
          const height = parseFloat(formData.height || '0');
          const depth = parseFloat(formData.depth || '0');
          const year = parseInt(formData.year || new Date().getFullYear().toString(), 10);
          
          console.log('💯 Calling API route to insert artwork...');
          
          // Prepare API payload - include all fields from the form
          const apiPayload = {
            user_id: session.user.id,
            title: formData.title,
            description: formData.description,
            price: price,
            category: formData.category,
            artist_name: formData.artistName,
            location: formData.location,
            provenance: formData.provenance,
            width: width || null,
            height: height || null,
            depth: depth || null,
            measurement_unit: formData.measurementUnit,
            year: year || null,
            materials: formData.materials || null,
            status: 'pending'
          };
          
          console.log('🔍 API payload prepared:', JSON.stringify(apiPayload).substring(0, 100) + '...');
          
          // Determine the correct API endpoint with better detection
          let apiEndpoint;
          
          if (typeof window !== 'undefined') {
            // Client-side: determine environment
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
              // Local development - always use the dev server
              apiEndpoint = 'http://localhost:9000/.netlify/functions/submit-artwork';
              console.log('🔍 Local development detected, using dev server endpoint');
            } else {
              // Production - use relative path for Netlify functions
              apiEndpoint = '/.netlify/functions/submit-artwork';
              console.log('🔍 Production environment detected, using relative endpoint');
            }
          } else {
            // Server-side fallback (should not happen since this is client-side)
            apiEndpoint = '/.netlify/functions/submit-artwork';
            console.log('🔍 Server-side rendering, using relative endpoint');
          }
          
          console.log(`🔍 Final endpoint: ${apiEndpoint}`);
          
          // Test endpoint availability first in development only
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            try {
              console.log('🔍 Testing dev server availability...');
              const testResponse = await fetch('http://localhost:9000/.netlify/functions/submit-artwork', {
                method: 'OPTIONS'
              });
              console.log('🔍 Dev server test response status:', testResponse.status);
              if (!testResponse.ok) {
                throw new Error('Dev server not responding');
              }
            } catch (testError) {
              console.error('🔍 Dev server test failed:', testError);
              throw new Error('Development server is not running. Please run "npm run dev:all" or start the Netlify dev server separately.');
            }
          }
          
          console.log(`🔍 Sending API request to ${apiEndpoint}`);
          
          // IMPORTANT: Use the API route for database operations
          let artwork;
          try {
            const apiResponse = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(apiPayload)
            });
            
            // Log response for debugging
            console.log('🔍 API response received, status:', apiResponse.status);
            
            // Check if the response is ok before trying to parse JSON
            if (!apiResponse.ok) {
              let errorMessage = `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
              try {
                const errorData = await apiResponse.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
              } catch (jsonError) {
                // If we can't parse the error response, use the status text
                console.error('Failed to parse error response:', jsonError);
              }
              throw new Error(errorMessage);
            }
            
            console.log('🔍 Parsing API response');
            const result = await apiResponse.json();
            console.log('💯 API response data:', result);
            
            artwork = result.artwork;
            console.log('💯 Successfully created artwork:', artwork.id);
          } catch (fetchError: any) {
            console.error('🚀 Network/Fetch Error:', fetchError);
            
            // Provide user-friendly error messages based on error type
            if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
              throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
            } else if (fetchError.message.includes('404')) {
              throw new Error('Server endpoint not found. Please try again later or contact support.');
            } else if (fetchError.message.includes('500')) {
              throw new Error('Server error occurred. Please try again later.');
            } else {
              throw fetchError; // Re-throw with original message
            }
          }
          
          // Link images to artwork
          console.log('🔍 Preparing to link images to artwork');
          const imagesData = successfulUploads.map(img => {
            // Log the original URL for debugging
            console.log('🔍 Processing image URL:', img.url);
            
            // Determine the file_path based on URL structure
            let file_path;
            if (img.url.includes('/public/')) {
              // Extract just the filename without redundant prefixes
              const fileNamePart = img.url.split('/public/')[1];
              // Create a path similar to other working images
              const userId = session.user.id.substring(0, 8); // Use part of user ID to mimic the UUID format
              file_path = `${fileNamePart}`;
              console.log('🔍 Public path detected, setting file_path to:', file_path);
            } else if (img.url.includes('artwork-images/')) {
              // For paths that already include artwork-images, just extract the actual path
              // This extracts everything after the first occurrence of artwork-images/
              file_path = img.url.split('artwork-images/')[1];
              console.log('🔍 Artwork-images path detected, setting file_path to:', file_path);
            } else {
              file_path = img.url;
              console.log('🔍 Unknown path structure, using URL directly:', file_path);
            }
            
            return {
              artwork_id: artwork.id,
              url: img.url,
              is_primary: img.is_primary,
              display_order: img.display_order,
              file_path: file_path
            };
          });
          
          console.log('🔍 Image link data prepared:', JSON.stringify(imagesData).substring(0, 100) + '...');
          
          // Use the same base URL for the images endpoint
          const imagesEndpoint = `${apiEndpoint.split('/').slice(0, -1).join('/')}/artwork-images`;
            
          console.log(`🔍 Sending request to link images using ${imagesEndpoint}`);
          
          // Use API route for this too to avoid RLS issues
          const imagesResponse = await fetch(imagesEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              images: imagesData
            })
          });
          
          console.log('🔍 Image link response received, status:', imagesResponse.status);
          
          if (!imagesResponse.ok) {
            const imagesResult = await imagesResponse.json();
            console.error('🔍 Failed to link images:', imagesResult);
            toast.error('Images were saved but couldn\'t be linked to the artwork', { id: dbToastId });
              } else {
            console.log('💯 Images linked successfully!');
            toast.success('Artwork submitted successfully!', { id: dbToastId });
            
            // Navigate to success page
            console.log('🔍 Preparing to redirect to success page');
            setTimeout(() => {
              router.push('/sell/success');
            }, 1500);
          }
        } catch (dbError) {
          console.error('🚀 Database operation error:', dbError);
          toast.error('Failed to save artwork to database', { id: dbToastId });
          setLoading(false);
        }
      } catch (uploadError) {
        console.error('🚀 Image upload process error:', uploadError);
        toast.error('Failed to process image uploads');
        setLoading(false);
      }
    } catch (error) {
      console.error('🚀 Overall submission error:', error);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Keep the old function but rename it so we don't use it
  const handleSubmit_OLD = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (images.length === 0) {
        toast.error('Please upload at least one image');
        setLoading(false);
        return;
      }
      
      // Validate price
      const priceValue = unformatPrice(formData.price);
      if (!priceValue || isNaN(parseFloat(priceValue))) {
        toast.error('Please enter a valid price');
        setLoading(false);
        return;
      }
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error(`Authentication error: ${sessionError.message}`);
        setLoading(false);
        return;
      }
      
      if (!session) {
        console.error('No session found, redirecting to login');
        toast.error('Please sign in to submit an item');
        router.push('/auth?redirect=/sell/new');
        setLoading(false);
        return;
      }

      // This is the original code that we're no longer using
      console.log('This old function is not being used anymore');
    } catch (error) {
      console.error('Error in old function (not used):', error);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">List a New Item</h1>
          
          <form 
            onSubmit={(e) => {
              console.log('🟢 FORM SUBMIT EVENT FIRED');
              submitArtwork(e);
            }} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter item title"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                >
                  <option value="paintings">Paintings</option>
                  <option value="sculptures">Sculptures</option>
                  <option value="photography">Photography</option>
                  <option value="digital">Digital Art</option>
                  <option value="mixed-media">Mixed Media</option>
                  <option value="accessories">Accessories</option>
                  <option value="consumables">Consumables</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="artistName" className="block text-sm font-medium mb-2">{getArtistLabel}</label>
                <Input
                  id="artistName"
                  name="artistName"
                  required
                  value={formData.artistName}
                  onChange={handleInputChange}
                  placeholder={`Enter ${getArtistLabel.toLowerCase()}`}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
                <Input
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter item location"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter item description"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="measurementUnit" className="block text-sm font-medium mb-2">Unit of Measurement</label>
              <select
                id="measurementUnit"
                name="measurementUnit"
                value={formData.measurementUnit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              >
                <option value="cm">Centimeters (cm)</option>
                <option value="m">Meters (m)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="width" className="block text-sm font-medium mb-2">Width</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                <Input
                      id="width"
                      name="width"
                  type="number"
                  required
                  value={formData.width}
                      onChange={handleInputChange}
                  placeholder="Width"
                />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium mb-2">Height</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                <Input
                      id="height"
                      name="height"
                  type="number"
                  required
                  value={formData.height}
                      onChange={handleInputChange}
                  placeholder="Height"
                />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="depth" className="block text-sm font-medium mb-2">Depth</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                <Input
                      id="depth"
                      name="depth"
                  type="number"
                  required
                  value={formData.depth}
                      onChange={handleInputChange}
                  placeholder="Depth"
                />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2">Year</label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  required
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="Year of creation"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2">Price</label>
                <div className="flex space-x-2">
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                  <div className="flex-1 relative">
                <Input
                      id="price"
                      name="price"
                  required
                      type="text"
                      inputMode="numeric"
                  value={formData.price}
                      onChange={handlePriceChange}
                      onBlur={handlePriceBlur}
                  placeholder="Enter price"
                      className="pr-16" // Add padding for the suffix
                    />
                    {formData.price && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {getDisplayPrice(formData.price)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="provenance" className="block text-sm font-medium mb-2">Provenance</label>
              <textarea
                id="provenance"
                name="provenance"
                value={formData.provenance}
                onChange={handleInputChange}
                placeholder="Enter item history and ownership details"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="materials" className="block text-sm font-medium mb-2">Materials</label>
              <Input
                id="materials"
                name="materials"
                value={formData.materials || ''}
                onChange={handleInputChange}
                placeholder="e.g., Oil on canvas, Bronze, etc."
              />
            </div>

            <div>
              <label id="images-label" className="block text-sm font-medium mb-2">Images</label>
              
              {/* Image upload button */}
              <div className="mb-4">
                <label htmlFor="image-upload" className="inline-flex items-center px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none cursor-pointer">
                  <Upload className="w-5 h-5 mr-2" />
                  Select Images
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    aria-labelledby="images-label"
                  />
                </label>
                <span className="ml-2 text-sm text-gray-500">
                  You can select multiple images at once
                </span>
              </div>
              
              {/* Image previews */}
              {images.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Selected Images ({images.length})</h3>
                    <div className="flex space-x-2 items-center">
                      <span className="text-xs text-gray-500">First image will be the primary image</span>
                      <button
                        type="button"
                        onClick={() => setImages([])}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                      <div key={index} className={`relative border-2 rounded-lg ${index === 0 ? 'border-primary' : 'border-gray-200'}`}>
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                          loading="lazy"
                    />
                        <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                            className="p-1 bg-white rounded-full shadow-sm hover:bg-red-100"
                            title="Remove image"
                            aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Reordering controls */}
                        <div className="absolute bottom-2 left-2 flex space-x-1">
                          {index === 0 && (
                            <div className="px-2 py-1 bg-primary text-white rounded-full text-xs">
                              Primary
                            </div>
                          )}
                          <div className="flex bg-white rounded-full border border-gray-200">
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className={`px-2 py-1 text-xs rounded-l-full ${
                                index === 0 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Move up"
                              aria-label={`Move image ${index + 1} up`}
                            >
                              ↑
                    </button>
                    <button
                      type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === images.length - 1}
                              className={`px-2 py-1 text-xs rounded-r-full ${
                                index === images.length - 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Move down"
                              aria-label={`Move image ${index + 1} down`}
                            >
                              ↓
                    </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    </div>
              )}
              
              {images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No images selected yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click the Select Images button above to upload</p>
              </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading || images.length === 0}
                id="submit-button"
                name="submit-button"
                onClick={() => {
                  console.log('🔴 Button clicked', { 
                    loading, 
                    imagesLength: images.length, 
                    isDisabled: loading || images.length === 0
                  });
                }}
              >
                {loading ? 'Submitting...' : 'Submit Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}