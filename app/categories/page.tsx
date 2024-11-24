"use client";

import { useRouter } from 'next/navigation';

const categories = [
  {
    title: 'Art',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
    description: 'Discover unique pieces from emerging and established artists',
    extendedDescription: 'Immerse yourself in a world of artistic excellence. Our curated art collection spans from contemporary masterpieces to timeless classics, featuring paintings, digital art, and mixed media works that push the boundaries of creative expression.',
    stats: {
      items: '2,500+',
      artists: '450+',
      avgValue: '$15,000'
    }
  },
  {
    title: 'Sculpture',
    image: 'https://images.unsplash.com/photo-1638186824584-6d6367254927?auto=format&fit=crop&q=80',
    description: 'Explore three-dimensional masterpieces',
    extendedDescription: 'Experience the power of form and space through our exceptional sculpture collection. From classical marble works to contemporary installations, each piece tells a unique story through its three-dimensional presence.',
    stats: {
      items: '1,200+',
      artists: '280+',
      avgValue: '$25,000'
    }
  },
  {
    title: 'Accessories',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80',
    description: 'Find the perfect complement to your collection',
    extendedDescription: 'Elevate your collection with our premium selection of accessories. Each piece is carefully chosen for its craftsmanship, historical significance, and potential for appreciation, offering both aesthetic and investment value.',
    stats: {
      items: '3,800+',
      artists: '620+',
      avgValue: '$8,000'
    }
  },
  {
    title: 'Consumables',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80',
    description: 'Premium collectible consumables',
    extendedDescription: 'Indulge in our exclusive range of collectible consumables. From rare vintage wines to limited-edition spirits, each item represents the pinnacle of its category, carefully preserved and authenticated for discerning collectors.',
    stats: {
      items: '950+',
      artists: '150+',
      avgValue: '$12,000'
    }
  },
  {
    title: 'Others',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80',
    description: 'Unique items that defy categorization',
    extendedDescription: 'Explore our most intriguing offerings that transcend traditional categories. This carefully curated selection features one-of-a-kind pieces that represent the intersection of art, innovation, and collectible value.',
    stats: {
      items: '750+',
      artists: '180+',
      avgValue: '$18,000'
    }
  }
];

export default function CategoriesPage() {
  const router = useRouter();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams({
      q: category,
      category: category
    });
    router.push(`/search?${params.toString()}`);
  };

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
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Categories</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Explore our curated collection of luxury items across various categories, each representing the pinnacle of craftsmanship and artistic excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((category) => (
            <div
              key={category.title}
              className="group cursor-pointer bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => handleCategoryClick(category.title)}
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${category.image})` }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {category.extendedDescription}
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Items</div>
                    <div className="font-bold text-lg">{category.stats.items}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Artists</div>
                    <div className="font-bold text-lg">{category.stats.artists}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Avg. Value</div>
                    <div className="font-bold text-lg">{category.stats.avgValue}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}