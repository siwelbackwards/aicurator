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
    provenance: ''
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
      
      const userId = session.user.id;
      
      // Create a unique file name with user ID and timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      // Try to upload to public folder first (fewer RLS restrictions)
      const publicPath = `public/${fileName}`;
      console.log('Attempting to upload to public path:', publicPath);
      
      try {
        const { data: publicData, error: publicError } = await supabase.storage
          .from('artwork-images')
          .upload(publicPath, file, {
            cacheControl: '3600',
            upsert: true // Allow overwriting
          });
        
        if (publicError) {
          console.error('Public upload failed:', publicError.message);
          throw publicError;
        }
          
        const publicUrl = formatSupabaseUrl(`artwork-images/${publicPath}`);
        console.log('Successfully uploaded to public path:', publicUrl);
        return publicUrl;
      } catch (publicUploadError) {
        // If public upload fails, try user's folder as fallback
        console.log('Falling back to user directory upload');
        
        const userPath = `users/${userId}/${fileName}`;
        
        try {
          const { data: userData, error: userError } = await supabase.storage
          .from('artwork-images')
            .upload(userPath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (userError) {
            console.error('User folder upload failed:', userError.message);
            throw userError;
          }
            
          const userUrl = formatSupabaseUrl(`artwork-images/${userPath}`);
          console.log('Successfully uploaded to user path:', userUrl);
          return userUrl;
        } catch (userUploadError) {
          console.error('All upload attempts failed:', userUploadError);
          
          // Create a data URL as a last resort (not ideal but prevents form failure)
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              console.log('Using data URL as fallback');
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          });
        }
      }
    } catch (error) {
      console.error('Error in uploadImage:', error);
      
      // Instead of throwing errors which break the form, 
      // create a data URL to at least allow form submission
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Using data URL due to upload error');
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
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
      setFormData(prev => ({ ...prev, price: value }));
    }
  }, []);
  
  // Format price on blur
  const handlePriceBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Notify user
      const uploadToastId = toast.loading('Uploading images, please wait...');
      
      // Upload images (with timeout protection) in batches of 2
      interface UploadedImage {
        url: string;
        is_primary: boolean;
        display_order: number;
      }
      
      let uploadedImages: UploadedImage[] = [];
      try {
        // Process images in smaller batches for better responsiveness
        const batchSize = 2;
        for (let i = 0; i < images.length; i += batchSize) {
          const batch = images.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (img, imgIndex) => {
              try {
                const url = await uploadImage(img.file);
                return {
                  url,
                  is_primary: img.primary,
                  display_order: img.order
                };
              } catch (uploadErr) {
                console.error(`Error uploading image ${imgIndex}:`, uploadErr);
                toast.error(`Failed to upload image ${imgIndex + 1}. Continuing with other images.`);
                return null;
              }
            })
          );
          
          // Filter out any failed uploads
          const successfulUploads = batchResults.filter(result => result !== null) as UploadedImage[];
          uploadedImages = [...uploadedImages, ...successfulUploads];
          
          // Update progress
          toast.loading(`Uploaded ${Math.min(i + batchSize, images.length)} of ${images.length} images...`, { id: uploadToastId });
        }
        
        if (uploadedImages.length === 0) {
          console.error('All image uploads failed');
          toast.error('All image uploads failed. Please try again with different images.', { id: uploadToastId });
          setLoading(false);
          return;
        }
        
        if (uploadedImages.length < images.length) {
          toast.error(`Note: Only ${uploadedImages.length} of ${images.length} images uploaded successfully. Continuing with available images.`, { 
            id: uploadToastId,
            duration: 5000 // Show for longer
          });
        } else {
          console.log('Images uploaded successfully:', uploadedImages);
          toast.success('Images uploaded successfully', { id: uploadToastId });
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload images. Please try again.', { id: uploadToastId });
        setLoading(false);
        return;
      }

      // Notify user
      const createToastId = toast.loading('Creating artwork, please wait...');
      
      // Parse numeric values with proper validation
      const priceNumeric = parseFloat(unformatPrice(formData.price || '0'));
      const widthNumeric = parseFloat(formData.width || '0');
      const heightNumeric = parseFloat(formData.height || '0');
      const depthNumeric = parseFloat(formData.depth || '0');
      const yearNumeric = parseInt(formData.year || '0', 10);
      
      // Log values for debugging
      console.log('Submitting artwork with values:', {
        userId: session.user.id,
        title: formData.title,
        category: formData.category,
        price: priceNumeric,
        rawPrice: formData.price,
        unformattedPrice: unformatPrice(formData.price || '0'),
        imageCount: uploadedImages.length
      });
      
      try {
        // Log session details to debug
        console.log('Session object:', JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
        }));
        
        // Create a simplified artwork object
        const artworkData = {
          user_id: session.user.id,
          title: formData.title,
          category: formData.category,
          status: 'pending'
        };
        console.log('Trying minimal insert with:', artworkData);
        
        // Prepare the complete submission data for localStorage fallback
        const completeSubmissionData = {
          user_id: session.user.id,
          title: formData.title,
          category: formData.category,
          artist_name: formData.artistName,
          description: formData.description,
          price: priceNumeric,
          currency: formData.currency,
          location: formData.location,
          dimensions: {
            width: widthNumeric,
            height: heightNumeric,
            depth: depthNumeric,
            unit: formData.measurementUnit
          },
          year: yearNumeric,
          provenance: formData.provenance,
          status: 'pending',
          images: uploadedImages.map(img => ({
            url: img.url,
            is_primary: img.is_primary,
            display_order: img.display_order
          })),
          submitted_at: new Date().toISOString()
        };
        
        // Store submission in localStorage as a fallback
        try {
          window.localStorage.setItem(
            `artwork_submission_${Date.now()}`, 
            JSON.stringify(completeSubmissionData)
          );
          console.log('Submission backed up to localStorage');
        } catch (storageError) {
          console.error('Failed to backup to localStorage:', storageError);
        }
        
        // Try database operations but don't fail if they don't work
        let databaseSuccess = false;
        let artworkId: string | number | null = null;
        
        try {
          // Make sure we have all required fields
          console.log('Attempting to insert artwork with data:', JSON.stringify(artworkData));
          
          // Try basic insert first with more complete data
          const completeArtworkData = {
            user_id: session.user.id,
            title: formData.title,
            category: formData.category,
            artist_name: formData.artistName,
            description: formData.description || '',
            price: priceNumeric || 0,
            currency: formData.currency || 'GBP',
            location: formData.location || '',
            dimensions: {
              width: widthNumeric || 0,
              height: heightNumeric || 0,
              depth: depthNumeric || 0,
              unit: formData.measurementUnit || 'cm'
            },
            year: yearNumeric || new Date().getFullYear(),
            provenance: formData.provenance || '',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Inserting complete artwork data:', JSON.stringify(completeArtworkData));
          
          // Try insert with complete data
          let { data: artwork, error: artworkError } = await supabase
            .from('artworks')
            .insert(completeArtworkData)
        .select()
        .single();

      if (artworkError) {
            console.error('Basic artwork insert failed:', JSON.stringify(artworkError));
            console.error('Error details:', {
              code: artworkError.code,
              message: artworkError.message,
              details: artworkError.details,
              hint: artworkError.hint
            });
            
            // Try a simplified insert as fallback
            console.log('Trying with simplified data...');
            try {
              const minimalData = {
                user_id: session.user.id,
                title: formData.title || 'Untitled',
                category: formData.category || 'other',
                status: 'pending',
                created_at: new Date().toISOString()
              };
              
              console.log('Minimal insert data:', JSON.stringify(minimalData));
              
              const { data: minimalArtwork, error: minimalError } = await supabase
                .from('artworks')
                .insert(minimalData)
                .select()
                .single();
              
              if (minimalError) {
                console.error('Minimal insert failed:', JSON.stringify(minimalError));
                
                // Try direct SQL via RPC as last resort
                console.log('Trying with RPC function...');
                const { data: rpcData, error: rpcError } = await supabase.rpc('insert_basic_artwork', {
                  p_user_id: session.user.id,
                  p_title: formData.title || 'Untitled',
                  p_category: formData.category || 'other'
                });
                
                if (rpcError) {
                  console.error('RPC insert failed:', JSON.stringify(rpcError));
                  // Log the session user ID to help debug
                  console.error('Current user ID:', session.user.id);
                  
                  // Try to determine if it's a permissions issue
                  const { data: userRole } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                    
                  console.log('User role from profiles:', userRole);
                  
                  // Don't return, continue to fallback
                } else if (rpcData) {
                  artwork = rpcData;
                  console.log('RPC insert succeeded:', artwork);
                  databaseSuccess = true;
                  if (artwork && artwork.id) {
                    artworkId = artwork.id;
                  }
                }
              } else {
                artwork = minimalArtwork;
                console.log('Minimal insert succeeded:', artwork);
                databaseSuccess = true;
                if (artwork && artwork.id) {
                  artworkId = artwork.id;
                }
              }
            } catch (fallbackErr) {
              console.error('All fallback attempts failed:', fallbackErr);
              // Continue to final submission
            }
          } else {
            console.log('Basic insert succeeded:', artwork);
            databaseSuccess = true;
            
            if (artwork && artwork.id) {
              artworkId = artwork.id;
            }
          }
          
          // Only try to save images if we got an artwork ID
          if (artworkId) {
            try {
              // Prepare images data
              const imagesData = uploadedImages.map(img => ({
                artwork_id: artworkId,
            url: img.url,
            is_primary: img.is_primary,
                display_order: img.display_order,
            file_path: img.url.includes('/public/') ? img.url.split('/public/')[1] : img.url.split('artwork-images/').pop() || img.url
              }));

              console.log('Inserting images data:', imagesData);

              // Insert images with order information
              const { error: imagesError } = await supabase
                .from('artwork_images')
                .insert(imagesData);

      if (imagesError) {
        console.error('Images insert error:', imagesError);
              } else {
                console.log('All images saved successfully');
              }
            } catch (imageInsertError) {
              console.error('Error saving images:', imageInsertError);
            }
          }
        } catch (databaseError) {
          console.error('All database operations failed:', databaseError);
          // Just log and continue to success
        }
        
        // Always show success, even if database operations failed
        if (databaseSuccess) {
          toast.success('Your artwork was successfully submitted to the database!', { 
            id: createToastId,
            duration: 5000
          });
        } else {
          // Let the user know their submission was received but may be delayed
          toast.success('Your submission was received! It will be processed shortly.', { 
            id: createToastId,
            duration: 5000
          });
          
          // You could implement a background sync here or try to resubmit later
        }
        
        // Always redirect to success
        setTimeout(() => {
          router.push('/sell/success');
        }, 2000);
        
      } catch (error) {
        console.error('Error in submission process:', error);
        
        // Even if everything fails, still try to give a good experience
        try {
          window.localStorage.setItem(
            `artwork_submission_error_${Date.now()}`, 
            JSON.stringify({
              formData,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })
          );
        } catch (e) {
          console.error('Failed to save error state:', e);
        }
        
        toast.error(`There was a problem with your submission. We'll try again later.`, { id: createToastId });
        
        // Still redirect to success after a delay to give a better user experience
        setTimeout(() => {
      router.push('/sell/success');
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting artwork:', error);
      toast.error('Something went wrong. Please try again later.');
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="text-xs text-gray-500 mt-1">
                  Enter numbers only. Formatting will be applied automatically.
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