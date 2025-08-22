import Hero from '@/components/home/hero';
import FeaturedCategories from '@/components/home/featured-categories';
import AIServices from '@/components/home/ai-services';
import TrendingProducts from '@/components/home/trending-products';
// import Partners from '@/components/home/partners'; // Temporarily hidden - preserved for future implementation

export default function Home() {
  return (
    <div>
      <Hero />
      {/* <Partners /> */} {/* Temporarily hidden - preserved for future implementation */}
      <FeaturedCategories />
      <AIServices />
      <TrendingProducts />
    </div>
  );
}