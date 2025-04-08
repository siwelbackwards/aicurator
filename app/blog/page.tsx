"use client";

import { Calendar, Clock } from 'lucide-react';

const blogs = [
  {
    id: 1,
    title: 'The Rise of AI in Art Authentication',
    excerpt: 'How artificial intelligence is revolutionizing the way we verify and authenticate valuable artworks.',
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
    category: 'Technology',
    author: 'Dr. Sarah Chen',
    date: 'March 15, 2024',
    readTime: '8 min read'
  },
  {
    id: 2,
    title: 'Collecting in the Digital Age',
    excerpt: 'A comprehensive guide to building and maintaining a valuable collection in the era of digital transformation.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80',
    category: 'Guides',
    author: 'Marcus Thompson',
    date: 'March 12, 2024',
    readTime: '12 min read'
  },
  {
    id: 3,
    title: 'Emerging Artists to Watch in 2024',
    excerpt: 'Discover the next generation of artistic talent reshaping the contemporary art landscape.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
    category: 'Art',
    author: 'Isabella Martinez',
    date: 'March 10, 2024',
    readTime: '10 min read'
  },
  {
    id: 4,
    title: 'The Psychology of Collecting',
    excerpt: 'Understanding the deep-rooted motivations and behaviors that drive collectors in their pursuit of rare items.',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80',
    category: 'Psychology',
    author: 'Dr. James Wilson',
    date: 'March 8, 2024',
    readTime: '15 min read'
  },
  {
    id: 5,
    title: 'Sustainable Luxury: The Future of Collecting',
    excerpt: 'How the luxury collectibles market is adapting to meet growing environmental consciousness.',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80',
    category: 'Sustainability',
    author: 'Emma Green',
    date: 'March 5, 2024',
    readTime: '9 min read'
  },
  {
    id: 6,
    title: 'Investment Strategies in Art',
    excerpt: 'Expert insights on building a collection that appreciates in both cultural and monetary value.',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80',
    category: 'Investment',
    author: 'Michael Chang',
    date: 'March 1, 2024',
    readTime: '11 min read'
  }
];

export default function BlogPage() {
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
            <h1 className="text-7xl font-serif font-bold mb-6 text-white tracking-wide">Blog</h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Insights, trends, and expert perspectives on the world of luxury collectibles and art investment.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="group">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl mb-4">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${blog.image})` }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 rounded-full text-sm font-medium">
                    {blog.category}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {blog.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {blog.readTime}
                  </div>
                </div>

                <h2 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                  {blog.title}
                </h2>
                
                <p className="text-gray-600 line-clamp-2">
                  {blog.excerpt}
                </p>

                <div className="pt-2">
                  <span className="text-sm text-gray-600">By {blog.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}