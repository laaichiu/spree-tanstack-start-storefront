import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { HomePageModel } from '@/lib/catalog/contracts'
import { CatalogProductCard } from '../catalog/catalog-product-card'
import { HomeFeaturedCategoriesView } from './home-featured-categories-view'
import type { HomeFeaturedCategoriesLabels } from './home-featured-categories-view'
import { HomeFeaturedProductsView } from './home-featured-products-view'
import type { HomeFeaturedProductsLabels } from './home-featured-products-view'
import { HeroView } from './hero-view'

type HomePageViewProps = {
  labels: {
    categories: HomeFeaturedCategoriesLabels
    featuredProducts: HomeFeaturedProductsLabels
    hero: {
      cta: string
      description: string
      eyebrow: string
      title: string
    }
    product: {
      discount: (percent: number) => string
      imageFallback: string
      outOfStock: string
      preorder: string
    }
  }
  marketParams: { country: string; locale: string }
  page: HomePageModel
}

/**
 * Complete home page view for the current storefront.
 */
export function HomePageView({
  labels,
  marketParams,
  page,
}: HomePageViewProps) {
  return (
    <>
      <HeroView
        ctaLabel={labels.hero.cta}
        description={labels.hero.description}
        eyebrow={labels.hero.eyebrow}
        renderCta={(content, className) => (
          <Link
            className={className}
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {content}
          </Link>
        )}
        title={labels.hero.title}
      />
      <HomeFeaturedProductsView
        key={`${marketParams.country}:${marketParams.locale}`}
        labels={labels.featuredProducts}
        products={page.featuredProducts.products}
        renderProductCard={({ product, renderProductLink }) => (
          <CatalogProductCard
            labels={labels.product}
            locale={marketParams.locale}
            product={product}
            renderProductLink={renderProductLink}
          />
        )}
        renderProductLink={(product, content, className) => (
          <Link
            className={className}
            params={{ ...marketParams, slug: product.slug }}
            to="/$country/$locale/products/$slug"
          >
            {content}
          </Link>
        )}
        renderProductsLink={(content, className) => (
          <Link
            className={className}
            params={marketParams}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {content}
          </Link>
        )}
        status={page.featuredProducts.status}
      />
      <HomeFeaturedCategoriesView
        categories={page.featuredCategories.categories}
        labels={labels.categories}
        renderCategoryLink={(category, content, className) => (
          <Link
            className={className}
            params={{ ...marketParams, _splat: category.permalink }}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/collections/$"
          >
            {content}
          </Link>
        )}
        status={page.featuredCategories.status}
      />
    </>
  )
}
