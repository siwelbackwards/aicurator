// This is a Server Component
import ProductClient from './product-client';

// Static params for build time generation
export function generateStaticParams() {
  // For now, we'll just generate one static page
  // Later, this could be populated from your database
  return [
    { id: 'g502' }
  ];
}

// Server Component that passes data to Client Component
export default function ProductPage({ params }: { params: { id: string } }) {
  // In the future, this could fetch data from your database
  const product = {
    id: 'g502',
    title: 'G502 X Lightspeed Paint Art',
    price: 1299,
    currentPrice: 1499,
    predictedPrice: 2499,
    description: 'An extraordinary masterpiece that seamlessly blends traditional artistic techniques with contemporary vision. This piece showcases a mesmerizing interplay of light and shadow, creating a dynamic visual narrative that captivates viewers and invites deep contemplation.',
    artist: {
      name: 'Picasso',
      image: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80',
      from: 'United Kingdom',
      birth: 'June 26, 1965',
      bio: 'A visionary artist whose work transcends conventional boundaries, pushing the limits of artistic expression through innovative techniques and bold experimentation.'
    },
    images: [
      'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'
    ],
    artHistory: {
      from: 'United Kingdom',
      launch: 'June 26, 1965',
      lastSold: 'June 26, 2024',
      history: 'This remarkable piece has a rich history of appreciation and recognition in the art world.'
    }
  };

  return <ProductClient product={product} />;
}