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
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80',
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
  const blogPosts = [
    {
      title: "The Rise of AI-Generated Art in Modern Collections",
      date: "March 15, 2024",
      excerpt: "Exploring how artificial intelligence is transforming the art world and creating new opportunities for collectors and creators alike.",
      author: "Sarah Chen",
      readTime: "5 min read"
    },
    {
      title: "Collecting Digital Art: A Beginner's Guide",
      date: "March 10, 2024",
      excerpt: "Everything you need to know about starting your digital art collection, from authentication to storage and display.",
      author: "Michael Roberts",
      readTime: "8 min read"
    },
    {
      title: "The Future of Luxury Collectibles",
      date: "March 5, 2024",
      excerpt: "How technology is changing the way we think about and collect luxury items, from digital art to virtual experiences.",
      author: "Emma Thompson",
      readTime: "6 min read"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-8">AI Curator Blog</h1>
        
        <div className="space-y-12">
          {blogPosts.map((post, index) => (
            <article key={index} className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold mb-2 hover:text-primary cursor-pointer">
                {post.title}
              </h2>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>{post.date}</span>
                <span className="mx-2">•</span>
                <span>{post.author}</span>
                <span className="mx-2">•</span>
                <span>{post.readTime}</span>
              </div>
              <p className="text-gray-600 mb-4">
                {post.excerpt}
              </p>
              <button className="text-primary font-medium hover:underline">
                Read more
              </button>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
}