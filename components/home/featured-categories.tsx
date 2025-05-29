"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Define static categories to ensure consistent rendering between server and client
const STATIC_CATEGORIES = [
  {
    title: 'Paintings',
    image: '/images/categories/art.webp',
    description: 'Discover unique paintings from emerging and established artists'
  },
  {
    title: 'Sculptures',
    image: '/images/categories/sculpture.webp',
    description: 'Explore three-dimensional masterpieces'
  },
  {
    title: 'Accessories',
    image: '/images/categories/accessories.webp',
    description: 'Find the perfect complement to your collection'
  },
  {
    title: 'Consumables',
    image: '/images/categories/consumables.webp',
    description: 'Premium collectible consumables'
  },
  {
    title: 'Other',
    image: '/images/categories/others.webp',
    description: 'Discover unique art forms that defy categorization'
  }
];

export default function FeaturedCategories() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  
  // Only set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams({
      category: category.toLowerCase()
    });
    router.push(`/search?${params.toString()}`);
  };

  // Ensure consistent rendering between server and client
  return (
    <section className="py-16 max-w-[1400px] mx-auto px-4">
      <h2 className="text-4xl font-serif mb-8">Featured Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category.title}
            className="group relative aspect-square overflow-hidden cursor-pointer rounded-lg"
            onClick={() => isClient && handleCategoryClick(category.title)}
          >
            <div className="absolute inset-0 w-full h-full">
              <Image 
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={false}
              />
            </div>
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
              <p className="text-sm text-white/90">{category.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}