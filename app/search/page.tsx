"use client";

import { useState, useEffect } from 'react';
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

// Define categories for dropdown
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'paintings', label: 'Paintings' },
  { value: 'sculptures', label: 'Sculptures' },
  { value: 'photography', label: 'Photography' },
  { value: 'digital', label: 'Digital Art' },
  { value: 'mixed-media', label: 'Mixed Media' },
  { value: 'other', label: 'Other' },
];

export default function SearchPage() {
  // Check if we're on the server for static generation
  const isServer = typeof window === 'undefined';
  
  const router = useRouter();
  const searchParams = !isServer ? useSearchParams() : null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('all');

  // Initialize from URL parameters
  useEffect(() => {
    if (isServer) return;
    
    const query = searchParams?.get('q') || '';
    const category = searchParams?.get('category') || 'all';
    
    setSearchQuery(query);
    setSelectedCategory(category);
    setAppliedQuery(query);
    setAppliedCategory(category);
  }, [searchParams, isServer]);

  const handleSearch = (e: React.FormEvent) => {
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

  // During static build or SSR, return a simplified placeholder
  if (isServer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 p-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold mb-6 text-center">Search Artwork</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow h-10 rounded-md border border-input bg-background" />
            <div className="w-full md:w-[180px] h-10 rounded-md border border-input bg-background" />
            <div className="md:w-[120px] h-10 rounded-md bg-primary" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            All Available Artwork
          </h2>
          
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Loading search results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-3xl font-bold mb-6 text-center">Search Artwork</h1>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search for artwork..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          
          <Select 
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button type="submit" className="md:w-[120px]">
            Search
          </Button>
        </form>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          {appliedQuery 
            ? `Results for "${appliedQuery}"${appliedCategory !== 'all' ? ` in ${CATEGORIES.find(c => c.value === appliedCategory)?.label}` : ''}`
            : 'All Available Artwork'}
        </h2>
        
        <SearchResultsStatic 
          query={appliedQuery} 
          category={appliedCategory} 
        />
      </div>
    </div>
  );
}