import { Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { ProductPrice } from '@/components/shared/product-price'
import { useMarket } from '@/components/layout/market-provider'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type { Product } from '@/lib/catalog/model/product'
import type { Money } from '@/lib/money/money'
import type { ProductReviewSummary } from '@/lib/reviews/model/product-review'

const ProductRatingAnchor = lazy(async () => {
  const module = await import('@/components/reviews/product-rating-anchor')

  return { default: module.ProductRatingAnchor }
})

type ProductDetailHeadingProps = {
  compareAtPrice?: Money | null
  price: Money | null
  product: Product
  reviewSummary: ProductReviewSummary | null
}

export function ProductDetailHeading({
  compareAtPrice,
  price,
  product,
  reviewSummary,
}: ProductDetailHeadingProps) {
  const { market, t } = useMarket()

  return (
    <>
      <nav
        aria-label={t('product.breadcrumbs')}
        className="text-sm leading-4 font-normal uppercase text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              className="transition-colors hover:text-foreground focus-visible:focus-ring"
              params={{
                country: market.country,
                locale: market.locale,
              }}
              to="/$country/$locale"
            >
              {t('product.breadcrumbHome')}
            </Link>
          </li>
          {product.categoryBreadcrumbs.length > 0 ? (
            product.categoryBreadcrumbs.map((item) => (
              <li className="flex items-center gap-2" key={item.id}>
                <span aria-hidden="true">/</span>
                <Link
                  className="transition-colors hover:text-foreground focus-visible:focus-ring"
                  params={{
                    country: market.country,
                    locale: market.locale,
                    _splat: item.permalink,
                  }}
                  search={DEFAULT_PRODUCT_LISTING_SEARCH}
                  to="/$country/$locale/collections/$"
                >
                  {item.name}
                </Link>
              </li>
            ))
          ) : (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="transition-colors hover:text-foreground focus-visible:focus-ring"
                  params={{
                    country: market.country,
                    locale: market.locale,
                  }}
                  search={DEFAULT_PRODUCT_LISTING_SEARCH}
                  to="/$country/$locale/products"
                >
                  {t('product.products')}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <section>
        <div className="flex items-start justify-between gap-5">
          <h1 className="max-w-lg text-lg font-normal tracking-wider text-foreground uppercase">
            {product.name}
          </h1>
          <ProductPrice
            compareAtPrice={compareAtPrice}
            price={price}
            variant="detail"
          />
        </div>

        {reviewSummary ? (
          <Suspense
            fallback={<div aria-hidden="true" className="mt-5 h-6 w-44" />}
          >
            <ProductRatingAnchor summary={reviewSummary} />
          </Suspense>
        ) : null}
      </section>
    </>
  )
}
