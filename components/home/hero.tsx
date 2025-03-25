"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const carouselItems = [
  {
    image: "/images/categories/home page/home_page_art.webp",
    title: "Luxury Collectibles",
    description: "Access invaluable expertise, bespoke AI-powered guidance, and exclusive connections, all meticulously curated to enhance and refine your collecting experience."
  },
  {
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80",
    title: "Rare Art Pieces",
    description: "Explore our curated collection of rare and unique art pieces from emerging and established artists around the globe."
  },
  {
    image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80",
    title: "Premium Accessories",
    description: "Browse our selection of high-end accessories and collectibles, each piece carefully selected for its uniqueness and value."
  }
];

export default function Hero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative h-[600px] flex items-center justify-center -mx-4 sm:-mx-6 lg:-mx-8">
      {carouselItems.map((item, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: `url('${item.image}')`,
              filter: "brightness(0.7)",
            }}
          />
          
          <div className="relative z-10 h-full flex items-center">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">
                {item.title}
              </h1>
              <p className="text-lg mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute z-20 bottom-32 left-0 right-0">
        <form onSubmit={handleSearch} className="flex items-stretch h-14 max-w-2xl mx-auto rounded-full overflow-hidden bg-black/30 backdrop-blur-md">
          <div className="flex items-center flex-1 pl-6">
            <Search className="h-5 w-5 text-white" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      <div className="absolute z-20 bottom-16 left-0 right-0 flex justify-center items-center gap-3">
        {carouselItems.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`group relative h-1 rounded-full transition-all duration-300 ${
              i === currentSlide ? "w-12 bg-white" : "w-6 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          >
            <span className="absolute -top-2 left-0 right-0 h-4 cursor-pointer" />
          </button>
        ))}
      </div>
    </section>
  );
}