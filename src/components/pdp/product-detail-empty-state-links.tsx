import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { EmptyStateCapabilities } from '@/components/shared/empty-state-view'

type ProductDetailEmptyStateLinksOptions = {
  marketParams: { country: string; locale: string }
}

export function createProductDetailEmptyStateLinks({
  marketParams,
}: ProductDetailEmptyStateLinksOptions): EmptyStateCapabilities {
  return {
    renderAction: (content, className) => (
      <Link
        className={className}
        params={marketParams}
        search={DEFAULT_PRODUCT_LISTING_SEARCH}
        to="/$country/$locale/products"
      >
        {content}
      </Link>
    ),
  }
}

export type { ProductDetailEmptyStateLinksOptions }
