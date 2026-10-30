import type {
  CategoryDetail,
  ProductListingFilters,
  ProductListingMeta,
  ProductListingPageModel,
  ProductListingSearch,
  ProductSummary,
} from '@/lib/catalog/contracts'
import { getMessage } from '@/lib/i18n/messages'
import type { MessageDictionary } from '@/lib/i18n/messages'

type ListingResult = {
  filters: ProductListingFilters | null
  meta: ProductListingMeta
  products: ProductSummary[]
}

type CollectionListingResult = ListingResult & {
  category: CategoryDetail
}

export function createProductsListingPage({
  listing,
  messages,
  search,
}: {
  listing: ListingResult | null
  messages: MessageDictionary
  search: ProductListingSearch
}): ProductListingPageModel {
  const query = search.q

  return {
    category: null,
    description: null,
    filters: listing?.filters ?? null,
    kind: 'products',
    meta: listing?.meta ?? null,
    products: listing?.products ?? [],
    search,
    status: listing ? 'ready' : 'error',
    title: query
      ? `${getMessage(messages, 'product.searchResultsFor')} "${query}"`
      : getMessage(messages, 'product.products'),
  }
}

export function createCollectionListingPage({
  listing,
  messages,
  search,
}: {
  listing: CollectionListingResult | null
  messages: MessageDictionary
  search: ProductListingSearch
}): ProductListingPageModel {
  const category = listing?.category ?? null

  return {
    category,
    description: category?.description || null,
    filters: listing?.filters ?? null,
    kind: 'collection',
    meta: listing?.meta ?? null,
    products: listing?.products ?? [],
    search,
    status: listing ? 'ready' : 'error',
    title:
      category?.name ??
      getMessage(messages, 'collection.collectionUnavailable'),
  }
}
