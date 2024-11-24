"use client";

import { useRouter } from 'next/navigation';

const categories = [
  {
    title: 'Art',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
    description: 'Discover unique pieces from emerging and established artists'
  },
  {
    title: 'Sculpture',
    image: 'https://images.unsplash.com/photo-1638186824584-6d6367254927?auto=format&fit=crop&q=80',
    description: 'Explore three-dimensional masterpieces'
  },
  {
    title: 'Accessories',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80',
    description: 'Find the perfect complement to your collection'
  },
  {
    title: 'Consumables',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80',
    description: 'Premium collectible consumables'
  },
  {
    title: 'Others',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80',
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