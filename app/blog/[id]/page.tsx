import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

// Add static params for blog posts
export function generateStaticParams() {
  // Generate static params for blog posts 1-6
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' }
  ];
}

// Blog post data (mock data)
const blogPosts = {
  '1': {
    title: 'The Art of Color Theory in Modern Paintings',
    date: 'Jun 15, 2023',
    author: 'Jane Smith',
    image: '/images/blog/color-theory.webp',
    content: `Color theory is a fundamental aspect of modern painting that artists use to create harmonious and visually appealing compositions. Understanding color relationships, complementary colors, and how different hues interact can transform an ordinary painting into an extraordinary one.

Many modern artists experiment with unconventional color combinations to evoke specific emotions or create visual interest. By studying color theory, artists can make deliberate choices that enhance their artistic expression.`,
  },
  '2': {
    title: 'Emerging Artists to Watch in 2023',
    date: 'Jul 3, 2023',
    author: 'Michael Johnson',
    image: '/images/blog/emerging-artists.webp',
    content: `The art world is constantly evolving, with new talents emerging each year. In 2023, several artists are making significant impacts with their innovative approaches and unique perspectives.

These emerging artists bring fresh ideas and techniques to the contemporary art scene, challenging conventional norms and expanding the boundaries of artistic expression. Their works often reflect current social issues and cultural shifts, making them particularly relevant in today's rapidly changing world.`,
  },
  '3': {
    title: 'The Impact of Digital Technology on Contemporary Art',
    date: 'Aug 12, 2023',
    author: 'Sarah Wilson',
    image: '/images/blog/digital-art.webp',
    content: `Digital technology has revolutionized the art world, introducing new mediums, tools, and possibilities for artistic expression. From digital painting and 3D modeling to virtual reality installations and AI-generated artwork, technology continues to reshape what art can be.

Contemporary artists increasingly incorporate digital elements into their practice, blurring the lines between traditional and digital art forms. This integration has led to innovative hybrid approaches that combine centuries-old techniques with cutting-edge technology.`,
  },
  '4': {
    title: 'Collecting Art as an Investment: Tips for Beginners',
    date: 'Sep 5, 2023',
    author: 'David Anderson',
    image: '/images/blog/art-investing.webp',
    content: `Art collecting can be both a passion and a smart investment strategy. For beginners looking to start an art collection with investment potential, understanding the market dynamics and developing an eye for quality are essential.

While established artists often provide safer investment opportunities, emerging artists can offer greater potential for appreciation. Researching art market trends, attending gallery openings, and building relationships with art advisors can help new collectors make informed decisions.`,
  },
  '5': {
    title: 'The Resurgence of Abstract Expressionism',
    date: 'Oct 18, 2023',
    author: 'Emily Parker',
    image: '/images/blog/abstract-expressionism.webp',
    content: `Abstract Expressionism, a movement that dominated American art in the 1940s and 1950s, is experiencing a significant revival in contemporary art circles. Today's artists are drawing inspiration from the emotional intensity and gestural freedom of Abstract Expressionism while adding their own modern perspectives.

This resurgence reflects a renewed interest in art that prioritizes emotional expression and spontaneity over rigid representation. Contemporary Abstract Expressionist works often incorporate new materials and techniques while maintaining the movement's core emphasis on conveying emotional and psychological states.`,
  },
  '6': {
    title: 'Sustainable Practices in Modern Art Creation',
    date: 'Nov 29, 2023',
    author: 'Thomas Green',
    image: '/images/blog/sustainable-art.webp',
    content: `As environmental consciousness grows, many artists are adopting sustainable practices in their work. From using eco-friendly materials and non-toxic paints to creating art that addresses environmental issues, sustainability has become an important consideration in contemporary art creation.

Some artists exclusively use recycled or repurposed materials, while others focus on creating biodegradable installations or artworks that highlight environmental concerns. This trend reflects the art world's increasing awareness of its ecological footprint and responsibility toward environmental stewardship.`,
  }
};

export default function BlogPost({ params }: { params: { id: string } }) {
  const postId = params.id;
  const post = blogPosts[postId as keyof typeof blogPosts] || blogPosts['1'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>
        
        <h1 className="text-4xl font-serif font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-500 mb-8">
          <span>{post.date}</span>
          <span className="mx-2">•</span>
          <span>By {post.author}</span>
        </div>
        
        <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
          <Image 
            src={post.image} 
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="prose max-w-none">
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-6 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}