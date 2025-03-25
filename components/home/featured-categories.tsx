"use client";

import { useRouter } from 'next/navigation';

const categories = [
  {
    title: 'Art',
    image: '/images/categories/art.webp',
    description: 'Discover unique pieces from emerging and established artists'
  },
  {
    title: 'Sculpture',
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
    title: 'Others',
    image: '/images/categories/others.webp',
    description: 'Unique items that defy categorization'
  }
];

export default function FeaturedCategories() {
  const router = useRouter();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams({
      q: category,
      category: 'All'
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="py-16 max-w-[1400px] mx-auto px-4">
      <h2 className="text-4xl font-serif mb-8">Featured Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category.title}
            className="group relative aspect-square overflow-hidden cursor-pointer rounded-lg"
            onClick={() => handleCategoryClick(category.title)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${category.image})` }}
            />
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