"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchResults from '@/components/search/search-results';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'art', label: 'Art' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'accessories', label: 'Accessories' }
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category')?.toLowerCase() || 'all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      q: searchQuery,
      category: selectedCategory
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[400px] -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/categories/home page/home_page_art.webp')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center">
          <div className="w-full max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-serif font-bold mb-6 text-white text-center">Search Results</h1>
            <form onSubmit={handleSearch} className="flex items-stretch h-14 rounded-full overflow-hidden bg-black/30 backdrop-blur-md">
              <div className="flex items-center flex-1 pl-6">
                <Search className="h-5 w-5 text-white" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent border-0 focus:ring-0 text-white placeholder-gray-300 px-3 text-lg outline-none"
                />
              </div>
              <div className="flex items-center px-2 border-l border-white/30">
                <ImagePlus className="h-5 w-5 text-white mx-3" />
              </div>
              <div className="flex items-center border-l border-white/30">
                <select 
                  className="h-full bg-transparent text-white border-0 px-4 appearance-none cursor-pointer hover:bg-white/10 transition-colors duration-200 text-lg font-medium focus:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option 
                      key={category.value} 
                      value={category.value} 
                      className="text-gray-900"
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button 
                type="submit"
                className="h-full px-8 bg-white hover:bg-gray-100 text-gray-900 rounded-none text-lg font-medium"
              >
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      <SearchResults query={searchQuery} category={selectedCategory} />
    </div>
  );
}