"use client";

import { useState, Suspense } from 'react';
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

function SearchForm() {
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
    <form onSubmit={handleSearch} className="flex items-stretch h-14 rounded-full overflow-hidden bg-black/30 backdrop-blur-md">
      <div className="flex items-center flex-1 pl-6">
        <Search className="h-5 w-5 text-white" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for artworks..."
          className="w-full bg-transparent border-none text-white placeholder:text-white/70 focus:outline-none focus:ring-0"
        />
      </div>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="bg-black/50 text-white border-none px-4 focus:outline-none focus:ring-0"
      >
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        className="h-full rounded-none px-6 bg-black/50 hover:bg-black/70 text-white"
      >
        Search
      </Button>
    </form>
  );
}

export default function SearchPage() {
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
            <Suspense fallback={<div className="h-14 bg-black/30 rounded-full animate-pulse" />}>
              <SearchForm />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <Suspense fallback={<div className="text-center py-12">Loading results...</div>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}