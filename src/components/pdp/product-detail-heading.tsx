import type { Product } from '@/lib/catalog/contracts'
import type { Money } from '@/lib/core/money'
import { getProductRatingAnchorDisplay } from '@/components/reviews/product-rating-anchor-model'
import type { ProductReviewSummary } from '@/lib/reviews/contracts'
import type { CatalogBreadcrumbDisplay } from '@/components/contracts/catalog'
import type { MessageKey } from '@/lib/i18n/messages'
import { getMoneyDisplay } from '@/components/shared/money-display'

import { useMarket } from '@/components/layout/market-provider'
import { getCatalogBreadcrumbDisplays } from '@/components/catalog/catalog-breadcrumb-display'
import { createProductDetailBreadcrumbRenderer } from '@/components/pdp/product-detail-breadcrumb-renderer'
import { PRODUCT_REVIEWS_SECTION_ID } from '@/components/reviews/product-reviews-section-id'
import {
  ProductDetailBreadcrumbsView,
  ProductDetailHeadingView,
} from './product-detail-heading-view'
import { Link } from '@tanstack/react-router'
import { DEFAULT_BRAND_SEARCH } from '@/lib/brands/contracts'

type ProductDetailHeadingProps = {
  compareAtPrice?: Money | null
  price: Money | null
  product: Product
  reviewSummary?: ProductReviewSummary | null
  showBreadcrumbs?: boolean
}

type ProductDetailBreadcrumbsProps = {
  product: Product
}

function getProductDetailBreadcrumbs(
  product: Product,
  translate: (key: MessageKey) => string,
) {
  const categoryBreadcrumbs = getCatalogBreadcrumbDisplays(
    product.categoryBreadcrumbs,
  )
  const breadcrumbs: CatalogBreadcrumbDisplay[] = [
    {
      id: 'home',
      label: translate('product.breadcrumbHome'),
    },
  ]

  if (categoryBreadcrumbs.length > 0) {
    breadcrumbs.push(...categoryBreadcrumbs)
  } else {
    breadcrumbs.push({
      id: 'products',
      label: translate('product.products'),
    })
  }

  return breadcrumbs
}

export function ProductDetailBreadcrumbs({
  product,
}: ProductDetailBreadcrumbsProps) {
  const { market, t } = useMarket()
  const breadcrumbs = getProductDetailBreadcrumbs(product, t)

  return (
    <ProductDetailBreadcrumbsView
      breadcrumbLabel={t('product.breadcrumbs')}
      breadcrumbs={breadcrumbs}
      renderBreadcrumb={createProductDetailBreadcrumbRenderer({
        categoryBreadcrumbs: product.categoryBreadcrumbs,
        marketParams: { country: market.country, locale: market.locale },
      })}
    />
  )
}

export function ProductDetailHeading({
  compareAtPrice,
  price,
  product,
  reviewSummary,
  showBreadcrumbs = true,
}: ProductDetailHeadingProps) {
  const { market, t } = useMarket()
  const reviewAnchor = reviewSummary
    ? getProductRatingAnchorDisplay(reviewSummary, market.locale, {
        goToReviews: t('reviews.goToReviews'),
        noReviews: t('reviews.noReviews'),
        readReviews: t('reviews.readReviews'),
        reviewPlural: t('reviews.reviewPlural'),
        reviewSingular: t('reviews.reviewSingular'),
        targetId: PRODUCT_REVIEWS_SECTION_ID,
      })
    : null
  const breadcrumbs = getProductDetailBreadcrumbs(product, t)

  return (
    <ProductDetailHeadingView
      breadcrumbs={breadcrumbs}
      model={{
        brand: product.brand
          ? { name: product.brand.name, slug: product.brand.slug }
          : null,
        breadcrumbLabel: t('product.breadcrumbs'),
        price: getMoneyDisplay(price, compareAtPrice, market.locale, {
          unitPrice: true,
        }),
        productName: product.name,
        reviewAnchor,
      }}
      renderBreadcrumb={createProductDetailBreadcrumbRenderer({
        categoryBreadcrumbs: product.categoryBreadcrumbs,
        marketParams: { country: market.country, locale: market.locale },
      })}
      showBreadcrumbs={showBreadcrumbs}
      renderBrand={(brand, props) => (
        <Link
          className={props.className}
          params={{
            country: market.country,
            locale: market.locale,
            slug: brand.slug,
          }}
          search={DEFAULT_BRAND_SEARCH}
          to="/$country/$locale/$slug"
        >
          {props.children}
        </Link>
      )}
    />
  )
}
