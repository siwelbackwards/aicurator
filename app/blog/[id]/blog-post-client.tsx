"use client";

import { useRouter } from 'next/navigation';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPostProps {
  post: {
    title: string;
    date: string;
    author: {
      name: string;
      image: string;
      role: string;
    };
    content: string;
    image: string;
    category: string;
    readTime: string;
    relatedPosts: Array<{
      id: string;
      title: string;
      excerpt: string;
      image: string;
      author: string;
      date: string;
    }>;
  };
}

export default function BlogPostClient({ post }: BlogPostProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] -mx-4 sm:-mx-6 lg:-mx-8 mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${post.image})`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center">
          <div className="max-w-4xl mx-auto px-4">
            <Button
              variant="ghost"
              className="mb-6 text-white hover:text-white/80"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
            <h1 className="text-5xl font-serif font-bold mb-6 text-white">{post.title}</h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Author Info */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={post.author.image}
            alt={post.author.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-bold text-lg">{post.author.name}</h3>
            <p className="text-gray-600">{post.author.role}</p>
          </div>
        </div>

        {/* Content */}
        <article 
          className="prose prose-lg max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Posts */}
        <div className="border-t pt-12">
          <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {post.relatedPosts.map((relatedPost) => (
              <div
                key={relatedPost.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/blog/${relatedPost.id}`)}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${relatedPost.image})` }}
                  />
                </div>
                <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-600 mb-2">{relatedPost.excerpt}</p>
                <div className="text-sm text-gray-500">
                  By {relatedPost.author} · {relatedPost.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}