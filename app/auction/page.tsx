"use client";

import { Construction } from 'lucide-react';

export default function AuctionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[300px] -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Auction</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Experience the thrill of bidding on exceptional pieces in our curated luxury auctions.
            </p>
          </div>
        </div>
      </div>

      {/* Under Construction Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
            <Construction className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-serif mb-4">Coming Soon</h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Our auction platform is currently being enhanced to provide you with an exceptional bidding experience. 
            We are meticulously crafting features that will revolutionize how you discover and acquire rare collectibles. 
            Stay tuned for the unveiling of this exciting addition to our platform.
          </p>
        </div>
      </div>
    </div>
  );
}