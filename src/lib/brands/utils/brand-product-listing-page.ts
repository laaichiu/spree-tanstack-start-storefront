import type {
  ProductListingPageModel,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { BrandProductListingPage } from '@/lib/brands/contracts'
import { translateMessage } from '@/lib/i18n/messages'

export function createBrandProductListingPage({
  listing,
  locale,
  search,
}: {
  listing: BrandProductListingPage | null
  locale: string
  search: ProductListingSearch
}): ProductListingPageModel {
  return {
    category: null,
    description: null,
    filters: listing?.filters ?? null,
    kind: 'products',
    meta: listing?.meta ?? null,
    products: listing?.products ?? [],
    search,
    status: listing ? 'ready' : 'error',
    title: translateMessage(locale, 'product.products'),
  }
}
