"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'Discover Future Master',
    description: 'Let our AI identify emerging artists with exceptional potential',
    image: '/images/services/future-master.webp',
    link: '/future-masters'
  },
  {
    title: 'Find My Best Match',
    description: 'Get personalized recommendations based on your taste',
    image: '/images/services/best-match.webp',
    link: '/best-matches'
  },
  {
    title: 'Bid for AI Curator Private Collection',
    description: 'Access exclusive collections curated by our AI',
    image: '/images/services/private-collection.webp',
    link: '/auction'
  }
];

export default function AIServices() {
  const router = useRouter();

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <h2 className="text-4xl font-serif mb-8">Our AI Driven Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="relative aspect-[2/1] overflow-hidden cursor-pointer group"
              onClick={() => router.push(service.link)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${service.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 group-hover:from-black/80 group-hover:via-black/60 group-hover:to-black/40 transition-colors duration-300" />
              <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                <h3 className="text-2xl font-bold">{service.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/90 max-w-[70%]">{service.description}</p>
                  <button 
                    className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 text-white flex items-center gap-2 text-sm font-medium"
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}