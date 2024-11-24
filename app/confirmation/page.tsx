"use client";

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const trendingProducts = [
  {
    title: 'Whispers of a Distant',
    price: '$1299',
    artist: 'Amara Selene',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80'
  },
  {
    title: 'Echoes in the Fog',
    price: '$1299',
    artist: 'Nico Bastien',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80'
  },
  {
    title: 'The Forgotten Horizon',
    price: '$1299',
    artist: 'Elara Voss',
    image: 'https://images.unsplash.com/photo-1545759843-49d5f0838d8f?auto=format&fit=crop&q=80'
  },
  {
    title: 'Velvet Dreams',
    price: '$1299',
    artist: 'Jasper Thorne',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80'
  }
];

export default function ConfirmationPage() {
  const router = useRouter();

  const handleProductClick = () => {
    router.push('/product');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Thank you for your interest!</h1>
        <h2 className="text-xl mb-6">What happens next?</h2>

        <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            A dedicated AI Curator advisor would reach you via email/phone in next 24 hours.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            They would organize the product viewing.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Product evaluation & verification to be close.
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Exchange of legal contract to close the transaction.
          </li>
        </ul>

        <Button 
          onClick={() => router.push('/')}
          className="w-full max-w-xs mb-16"
        >
          Ok
        </Button>

        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-left mb-6">Trending Products</h2>
          <p className="text-gray-600 text-left mb-8">Explore more exceptional pieces from our curated collection.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product, index) => (
              <div 
                key={index}
                className="cursor-pointer group"
                onClick={handleProductClick}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                </div>
                <h3 className="font-medium text-lg mb-1">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-2">By: {product.artist}</p>
                <p className="text-green-600 font-bold">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}