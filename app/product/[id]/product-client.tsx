"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmationDialog from '@/components/product/confirmation-dialog';

interface ProductProps {
  product: {
    id: string;
    title: string;
    price: number;
    currentPrice: number;
    predictedPrice: number;
    description: string;
    artist: {
      name: string;
      image: string;
      from: string;
      birth: string;
      bio: string;
    };
    images: string[];
    artHistory: {
      from: string;
      launch: string;
      lastSold: string;
      history: string;
    };
  };
}

export default function ProductClient({ product }: ProductProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const previousImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${product.images[currentImage]})` }}
              />
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg ${
                    currentImage === index ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">{product.title}</h1>
            <p className="text-xl text-green-600 font-bold">${product.price}</p>
            <p className="text-gray-600">{product.description}</p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${product.artist.image})` }}
                />
                <div>
                  <div className="font-medium">Artist: {product.artist.name}</div>
                  <div className="text-sm text-gray-500">From: {product.artist.from}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Price in 2014:</div>
                <div className="font-bold">${product.price}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Current Price:</div>
                <div className="font-bold">${product.currentPrice}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-sm text-gray-500">Predicted Price in 2034</div>
                <div className="font-bold">${product.predictedPrice}</div>
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
          </div>
        </div>

        {/* Artist Info */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">About Artist</h2>
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="w-20 h-20 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${product.artist.image})` }}
              />
              <div>
                <h3 className="text-xl font-bold">{product.artist.name}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="px-4 py-2 bg-gray-50 rounded-full">
                    Artist From: {product.artist.from}
                  </div>
                  <div className="px-4 py-2 bg-gray-50 rounded-full">
                    Artist Birth: {product.artist.birth}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">{product.artist.bio}</p>
          </div>
        </div>

        {/* Art History */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Art History</h2>
          <div className="bg-white p-6 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Art From: {product.artHistory.from}
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Art Launch: {product.artHistory.launch}
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-full text-center">
                Last Sold On: {product.artHistory.lastSold}
              </div>
            </div>
            <p className="text-gray-600">{product.artHistory.history}</p>
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