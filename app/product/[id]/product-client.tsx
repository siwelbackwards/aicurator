"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/product/confirmation-dialog';
import { supabase } from '@/lib/supabase-client';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { useRouter } from 'next/navigation';
import { formatSupabaseUrl } from '@/lib/utils';
import { formatPrice } from '@/lib/currency-utils';

interface ProductProps {
  productId: string;
}

interface Artwork {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  artist_name: string;
  location: string;
  year: number;
  provenance: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  measurement_unit?: string | null;
  images: {
    url: string;
    is_primary: boolean;
    file_path: string;
  }[];
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

// Add a function to get a valid image URL
const getValidImageUrl = (image: any) => {
  if (!image) return '';
  
  if (image.url && image.url.includes('http')) {
    return image.url;
  }
  
  if (image.file_path) {
    return formatSupabaseUrl(image.file_path);
  }
  
  return '';
};

// Helper function to format dimensions consistently
const formatDimensions = (artwork: Artwork): string => {
  // First check if we have the legacy dimensions object
  if (artwork.dimensions) {
    return `${artwork.dimensions.width} × ${artwork.dimensions.height} × ${artwork.dimensions.depth} ${artwork.dimensions.unit}`;
  }
  
  // Then check if we have the separate dimension fields
  if (artwork.width && artwork.height) {
    const dimensions = [`${artwork.width}`, `${artwork.height}`];
    
    // Add depth if available
    if (artwork.depth) {
      dimensions.push(`${artwork.depth}`);
    }
    
    // Join with × symbol and add unit
    return `${dimensions.join(' × ')} ${artwork.measurement_unit || 'cm'}`;
  }
  
  // If no dimensions available
  return 'Unknown';
};

export default function ProductClient({ productId }: ProductProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [product, setProduct] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        const { data: artwork, error } = await supabase
          .from('artworks')
          .select(`
            *,
            images:artwork_images(file_path, is_primary, url)
          `)
          .eq('id', productId)
          .eq('status', 'approved')
          .single();

        if (error) {
          throw error;
        }

        if (!artwork) {
          throw new Error('Artwork not found');
        }

        // Parse dimensions if it's a string
        if (artwork.dimensions && typeof artwork.dimensions === 'string') {
          try {
            artwork.dimensions = JSON.parse(artwork.dimensions);
          } catch (e) {
            console.error('Failed to parse dimensions:', e);
            // Keep the original value if parsing fails
          }
        }

        // Ensure all images have valid URLs
        if (artwork.images && artwork.images.length > 0) {
          // Fix any missing or invalid image URLs
          artwork.images = artwork.images.map((img: {url?: string, file_path?: string, is_primary: boolean}) => {
            // If URL is missing or just the base path, use a placeholder
            if (!img.url || img.url === 'artwork-images') {
              console.log('Fixing invalid image URL:', img);
              
              // If we have a file_path, construct a proper URL
              if (img.file_path && !img.file_path.startsWith('http')) {
                img.url = `https://cpzzmpgbyzcqbwkaaqdy.supabase.co/storage/v1/object/public/artwork-images/${img.file_path}`;
              } else {
                // Use a placeholder if we can't construct a valid URL
                img.url = 'https://source.unsplash.com/random/800x800/?art';
              }
            }
            return img;
          });
        } else {
          // Provide a placeholder image if no images
          artwork.images = [{
            url: 'https://source.unsplash.com/random/800x800/?art',
            is_primary: true,
            file_path: ''
          }];
        }

        // Fetch user profile data for the artist
        if (artwork.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', artwork.user_id)
            .single();

          if (profileData) {
            artwork.profiles = profileData;
          }
        }

        setProduct(artwork);
      } catch (error: any) {
        console.error('Error fetching product:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Artwork Not Found</h1>
        <p className="mb-8 text-gray-600">The artwork you're looking for is not available or does not exist.</p>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % (product.images?.length || 1));
  };

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1));
  };

  const handleContactSpecialist = () => {
    const subject = `Inquiry about "${product.title}" (Product ID: ${productId})`;
    const body = `Hello AI Curator Team,

I'm interested in learning more about this artwork:

Product: ${product.title}
Artist: ${product.artist_name}
Price: ${formatPrice(product.price, product.currency)}
Product ID: ${productId}

Please provide more information about this piece, including:
- Detailed condition report
- Authentication and provenance
- Shipping and delivery options
- Payment terms

Thank you!

Best regards,
[Your Name]`;

    const mailtoLink = `mailto:aicuratorinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  // Placeholder values for data we don't have
  const currentPrice = Math.round(product.price * 1.2);
  const predictedPrice = Math.round(product.price * 2);
  const artistImage = product.profiles?.avatar_url || 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80';

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <SupabaseImage
                  src={getValidImageUrl(product.images[currentImage])}
                  alt={product.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                disabled={!product.images || product.images.length <= 1}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                disabled={!product.images || product.images.length <= 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images && product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg ${
                    currentImage === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <SupabaseImage
                    src={getValidImageUrl(image)}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{product.title}</h1>
            <p className="text-xl text-green-600 font-bold">{formatPrice(product.price, product.currency)}</p>
            <p className="text-gray-600">{product.description}</p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <SupabaseImage
                    src={artistImage}
                    alt={product.artist_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">Artist: {product.artist_name}</div>
                  <div className="text-sm text-gray-500">From: {product.location || 'Unknown'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Original Price:</div>
                <div className="font-bold">{formatPrice(product.price, product.currency)}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Current Price:</div>
                <div className="font-bold">{formatPrice(currentPrice, product.currency)}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Estimated Future Value</div>
                <div className="font-bold">{formatPrice(predictedPrice, product.currency)}</div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                className="flex-1 gap-2"
                onClick={() => setShowConfirmation(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now
              </Button>
              <Button variant="outline" className="gap-2">
                <Heart className="w-5 h-5" />
                Add to wishlist
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full gap-2 mt-4"
              onClick={handleContactSpecialist}
            >
              <Mail className="w-5 h-5" />
              Ask a Product Specialist
            </Button>
          </div>
        </div>

        {/* Art Details */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Artwork Details</h2>
          <div className="bg-white p-6 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Location: {product.location || 'Unknown'}
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Year of Creation: {product.year || 'Unknown'}
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Size: {formatDimensions(product)}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Artist: {product.artist_name}</h3>
              <p className="text-gray-600">{product.provenance || 'No additional information available about this artwork.'}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog 
        isOpen={showConfirmation} 
        onClose={() => setShowConfirmation(false)} 
      />
    </div>
  );
}