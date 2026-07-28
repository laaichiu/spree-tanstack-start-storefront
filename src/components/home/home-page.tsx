import { CollectionGridSection } from '@/components/home/collection-grid-section'
import { FeaturedProductsSection } from '@/components/home/featured-products-section'
import { HeroSection } from '@/components/home/hero-section'
import type { HomePageModel } from '@/lib/catalog/model/home-page'

export function HomePage({ page }: { page: HomePageModel }) {
  return (
    <>
      <HeroSection />
      <FeaturedProductsSection section={page.featuredProducts} />
      <CollectionGridSection section={page.featuredCategories} />
    </>
  )
}
