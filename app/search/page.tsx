"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchResults from '@/components/search/search-results';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      q: searchQuery,
      category: selectedCategory
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[300px] flex items-center justify-center -mx-4 sm:-mx-6 lg:-mx-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://s3-alpha-sig.figma.com/img/7b02/bcd3/201ac4886d1756b3a3480f026737b155?Expires=1733097600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=k25qe0TLX0A0yJct5Myp7xMTHyd1R9NZ1u2TRhNJCTvl35qW41T4cCjzQzvMofkMsKHQgjeCE1cS6l4eMgHRgJOzbchSjEpkcQXyagViuSFcuYVT72tRsIrNx5umjfTkexFoCYOcdeAAIjMt0JSdGj57yvG-KRcsYmFk8kt5eeG1u5lfTf0G74Z3m-KCvFegxS1GDd6cLcOlNofzuA~uoFNHbrc9RtD9WCw4oqiSiwfDIKrQqsYU0o303W-qYCO-16jUNzEl0tnUf5rYidu1i-Kye6QBhHyuEQWkYKe1RQFyp~JZ7R-IjFxRco4CVt-5MG90NMHrXtL6AwVCTgQHkw__')`,
            filter: "brightness(0.7)",
          }}
        />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold mb-6 text-white">Search Results</h1>
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
                <option value="All" className="text-gray-900">All</option>
                <option value="Art" className="text-gray-900">Art</option>
                <option value="Sculpture" className="text-gray-900">Sculpture</option>
                <option value="Accessories" className="text-gray-900">Accessories</option>
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

      <SearchResults query={searchQuery} category={selectedCategory} />
    </div>
  );
}