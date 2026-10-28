import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import type { ProductSummary } from '@/lib/catalog/contracts'
import { CatalogProductCard } from '@/components/catalog/catalog-product-card'
import { ProductRelatedProductsView } from './product-related-products-view'

type ProductPageViewProps = {
  labels: {
    discount: (percent: number) => string
    imageFallback: string
    outOfStock: string
    preorder: string
    relatedProductsTitle: string
  }
  locale: string
  marketParams: { country: string; locale: string }
  relatedProducts: readonly ProductSummary[]
  slots: {
    breadcrumbs: ReactNode
    desktopHeading: ReactNode
    gallery: ReactNode
    mobileHeading: ReactNode
    purchase: ReactNode
    reviews: ReactNode
  }
}

/**
 * The current storefront owns PDP layout and section order.
 *
 * Product behavior stays in the PDP controller and feature components so the
 * view does not own commerce state or Spree request details.
 */
export function ProductPageView({
  labels,
  locale,
  marketParams,
  relatedProducts,
  slots,
}: ProductPageViewProps) {
  const relatedProductsContent =
    relatedProducts.length > 0 ? (
      <ProductRelatedProductsView
        cards={relatedProducts.map((product) => (
          <Fragment key={product.id}>
            <CatalogProductCard
              labels={labels}
              locale={locale}
              product={product}
              renderProductLink={(content, className) => (
                <Link
                  aria-label={`View ${product.name}`}
                  className={className}
                  params={{ ...marketParams, slug: product.slug }}
                  to="/$country/$locale/products/$slug"
                >
                  {content}
                </Link>
              )}
              variant="listing"
            />
          </Fragment>
        ))}
        title={labels.relatedProductsTitle}
      />
    ) : null

  return (
    <article className="mx-auto w-full max-w-screen-2xl px-4 py-8 pb-10 lg:px-8 lg:py-8 lg:pb-14">
      <div className="grid items-start gap-x-10 gap-y-5 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8 xl:gap-x-10">
        <div className="lg:col-span-2">
          <div className="pb-7">{slots.breadcrumbs}</div>
          {slots.gallery}
          <div className="pt-7 lg:hidden">{slots.mobileHeading}</div>
        </div>

        <section className="space-y-0 lg:sticky lg:top-24 lg:self-start lg:space-y-5">
          <div className="hidden space-y-5 pb-3 lg:block">
            {slots.desktopHeading}
          </div>

          {slots.purchase}
        </section>
      </div>

      {relatedProductsContent}
      {slots.reviews}
    </article>
  )
}
