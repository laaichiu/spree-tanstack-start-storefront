import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductSummary } from '@/lib/catalog/contracts'
import { getSearchProductCardModel } from '@/components/layout/search-drawer/search-drawer-product-card-model'
import {
  SearchFeaturedProductCardView,
  SearchPreviewRowView,
} from '@/components/layout/search-product-card-view'

type SearchProductLinkOptions = {
  children: ReactNode
  className: string
  draggable?: boolean
}

function createSearchProductLinkRenderer({
  marketParams,
  onSelect,
  product,
}: {
  marketParams: { country: string; locale: string }
  onSelect: () => void
  product: ProductSummary
}) {
  return ({ children, className, draggable }: SearchProductLinkOptions) => (
    <Link
      className={className}
      draggable={draggable}
      onClick={onSelect}
      params={{ ...marketParams, slug: product.slug }}
      to="/$country/$locale/products/$slug"
    >
      {children}
    </Link>
  )
}

export function SearchPreviewRow({
  onSelect,
  product,
}: {
  onSelect: () => void
  product: ProductSummary
}) {
  const { market, t } = useMarket()
  const model = getSearchProductCardModel(product, market.locale)
  const renderProductLink = createSearchProductLinkRenderer({
    marketParams: { country: market.country, locale: market.locale },
    onSelect,
    product,
  })

  return (
    <SearchPreviewRowView
      imageFallback={t('product.imageComingSoon')}
      model={model}
      renderProductLink={renderProductLink}
    />
  )
}

export function SearchFeaturedProductCard({
  onSelect,
  product,
}: {
  onSelect: () => void
  product: ProductSummary
}) {
  const { market, t } = useMarket()
  const model = getSearchProductCardModel(product, market.locale)
  const renderProductLink = createSearchProductLinkRenderer({
    marketParams: { country: market.country, locale: market.locale },
    onSelect,
    product,
  })

  return (
    <SearchFeaturedProductCardView
      imageFallback={t('product.imageComingSoon')}
      model={model}
      renderProductLink={renderProductLink}
    />
  )
}
