import type {
  ProductListingPageModel,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { BrandProductListingPage } from '@/lib/brands/contracts'
import { getMessage } from '@/lib/i18n/messages'
import type { MessageDictionary } from '@/lib/i18n/messages'

export function createBrandProductListingPage({
  listing,
  messages,
  search,
}: {
  listing: BrandProductListingPage | null
  messages: MessageDictionary
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
    title: getMessage(messages, 'product.products'),
  }
}
