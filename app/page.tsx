import Hero from '@/components/home/hero';
import FeaturedCategories from '@/components/home/featured-categories';
import AIServices from '@/components/home/ai-services';
import TrendingProducts from '@/components/home/trending-products';
import Partners from '@/components/home/partners';

export default function Home() {
  return (
    <div>
      <Hero />
      <Partners />
      <FeaturedCategories />
      <AIServices />
      <TrendingProducts />
    </div>
  );
}