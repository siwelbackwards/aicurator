import Hero from '@/components/home/hero';
import FeaturedCategories from '@/components/home/featured-categories';
import AIServices from '@/components/home/ai-services';
import TrendingProducts from '@/components/home/trending-products';
import { testConnection, getConnectionStatus } from '@/lib/supabase';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const status = getConnectionStatus();
    console.log('Supabase Connection Info:', status);
    
    testConnection().then(success => {
      console.log('Connection test result:', success ? 'SUCCESS' : 'FAILED');
    });
  }, []);

  return (
    <div>
      <Hero />
      <FeaturedCategories />
      <AIServices />
      <TrendingProducts />
    </div>
  );
}