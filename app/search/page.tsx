"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SearchResultsStatic from '@/components/search/search-results-static';

// Define categories to match the featured categories and hero dropdown
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'paintings', label: 'Paintings' },
  { value: 'sculptures', label: 'Sculptures' },
  { value: 'other', label: 'Other' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'photography', label: 'Photography' },
  { value: 'mixed-media', label: 'Mixed Media' }
];

// Create a client component that uses useSearchParams
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('all');
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    
    // Initialize from URL parameters after mounting
    const query = searchParams?.get('q') || '';
    const category = searchParams?.get('category') || 'all';
    
    setSearchQuery(query);
    setSelectedCategory(category);
    setAppliedQuery(query);
    setAppliedCategory(category);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    if (!isClient) return;
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    
    // Update the URL
    router.push(`/search?${params.toString()}`);
    
    // Update applied filters for the results component
    setAppliedQuery(searchQuery);
    setAppliedCategory(selectedCategory);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-3xl font-bold mb-6 text-center">Search Artwork</h1>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search for artwork..."
            value={searchQuery}
            onChange={(e) => isClient && setSearchQuery(e.target.value)}
            className="flex-grow"
            disabled={!isClient}
          />
          
          <div className="relative w-full md:w-[180px]">
            <Select value={selectedCategory} disabled={!isClient}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Category">
                  {isClient ? CATEGORIES.find(c => c.value === selectedCategory)?.label : 'Category'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    onClick={() => isClient && setSelectedCategory(category.value)}
                    className="cursor-pointer"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="md:w-[120px]" disabled={!isClient}>
            Search
          </Button>
        </form>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          {isClient && (appliedQuery 
            ? `Results for "${appliedQuery}"${appliedCategory !== 'all' ? ` in ${CATEGORIES.find(c => c.value === appliedCategory)?.label}` : ''}`
            : appliedCategory !== 'all' 
              ? `${CATEGORIES.find(c => c.value === appliedCategory)?.label}`
              : 'All Available Artwork')}
          {!isClient && 'All Available Artwork'}
        </h2>
        
        {isClient && (
          <SearchResultsStatic 
            query={appliedQuery} 
            category={appliedCategory} 
          />
        )}
      </div>
    </div>
  );
}

// Main page component that wraps SearchContent in a Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 p-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold mb-6 text-center">Search Artwork</h1>
          <div className="animate-pulse flex flex-col md:flex-row gap-4">
            <div className="flex-grow h-10 bg-gray-200 rounded"></div>
            <div className="w-full md:w-[180px] h-10 bg-gray-200 rounded"></div>
            <div className="md:w-[120px] h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col md:flex-row gap-6 p-6 border rounded-lg">
              <div className="md:w-1/3 aspect-square bg-gray-200 rounded-lg" />
              <div className="md:w-2/3 space-y-4">
                <div className="h-7 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-9 bg-gray-200 rounded w-1/4 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}