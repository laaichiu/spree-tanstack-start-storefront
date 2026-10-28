import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductListingPageModel,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type {
  CatalogBreadcrumbLink,
  ProductListingHeadingModel,
} from '@/components/contracts/catalog'

import { getProductListingController } from './product-listing-controller'
import { ProductListingPageView } from './product-listing-page-view'

type ProductListingPageProps = {
  attribution?: string
  heading?: ProductListingHeadingModel
  onApply: (search: ProductListingSearch) => void
  page: ProductListingPageModel
  renderBreadcrumb?: CatalogBreadcrumbLink
  showHeading?: boolean
}

export function ProductListingPage({
  attribution,
  heading,
  onApply,
  page,
  renderBreadcrumb,
  showHeading = true,
}: ProductListingPageProps) {
  const { market, t } = useMarket()
  const controller = getProductListingController({ market, onApply, page, t })
  const lifecycleKey = JSON.stringify({
    categoryId: page.category?.id ?? null,
    kind: page.kind,
    market: [market.country, market.locale],
    products: page.products.map((product) => product.id),
    search: page.search,
    heading,
    renderBreadcrumb: Boolean(renderBreadcrumb),
    showHeading,
  })

  return (
    <ProductListingPageView
      controller={controller}
      attribution={attribution}
      key={lifecycleKey}
      market={market}
      heading={heading}
      renderBreadcrumb={renderBreadcrumb}
      showHeading={showHeading}
      t={t}
    />
  )
}
