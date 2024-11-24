import Hero from '@/components/home/hero';
import FeaturedCategories from '@/components/home/featured-categories';
import AIServices from '@/components/home/ai-services';
import TrendingProducts from '@/components/home/trending-products';

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedCategories />
      <AIServices />
      <TrendingProducts />
    </div>
  );
}