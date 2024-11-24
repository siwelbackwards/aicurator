// This is a Server Component
import BlogPostClient from './blog-post-client';

// Static params for build time generation
export function generateStaticParams() {
  // Generate static pages for all blog posts
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' }
  ];
}

// Server Component that passes data to Client Component
export default function BlogPostPage({ params }: { params: { id: string } }) {
  // Mock data - in the future, this would come from your database
  const blogPost = {
    id: params.id,
    title: 'The Rise of AI in Art Authentication',
    date: 'March 15, 2024',
    author: {
      name: 'Dr. Sarah Chen',
      image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
      role: 'Art Technology Researcher'
    },
    content: `
      <p>How artificial intelligence is revolutionizing the way we verify and authenticate valuable artworks. The integration of AI technology in art authentication has marked a significant turning point in how we approach the verification of valuable artworks.</p>
      
      <h2>The Challenge of Authentication</h2>
      <p>Traditional methods of art authentication have relied heavily on expert opinion and scientific analysis. While these approaches remain valuable, they can be time-consuming and sometimes subjective. AI brings a new level of precision and efficiency to this process.</p>
      
      <h2>AI's Role in Authentication</h2>
      <p>Modern AI systems can analyze countless data points in artwork, from brush stroke patterns to material composition, providing a level of detail that human analysis alone might miss. This technology doesn't replace human expertise but rather enhances it, offering additional layers of verification.</p>
      
      <h2>Looking to the Future</h2>
      <p>As AI technology continues to evolve, we can expect even more sophisticated authentication methods. The combination of human expertise and artificial intelligence promises to make art authentication more accurate and accessible than ever before.</p>
    `,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
    category: 'Technology',
    readTime: '8 min read',
    relatedPosts: [
      {
        id: '2',
        title: 'Collecting in the Digital Age',
        excerpt: 'A comprehensive guide to building and maintaining a valuable collection in the era of digital transformation.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80',
        author: 'Marcus Thompson',
        date: 'March 12, 2024'
      },
      {
        id: '3',
        title: 'Emerging Artists to Watch in 2024',
        excerpt: 'Discover the next generation of artistic talent reshaping the contemporary art landscape.',
        image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
        author: 'Isabella Martinez',
        date: 'March 10, 2024'
      }
    ]
  };

  return <BlogPostClient post={blogPost} />;
}