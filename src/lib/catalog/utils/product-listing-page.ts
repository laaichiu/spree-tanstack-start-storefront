import type { CategoryDetail } from '@/lib/catalog/model/category'
import type { ProductListingPageModel } from '@/lib/catalog/model/product-listing-page'
import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { translateMessage } from '@/lib/i18n/messages'

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
  locale,
  search,
}: {
  listing: ListingResult | null
  locale: string
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
      ? `${translateMessage(locale, 'product.searchResultsFor')} "${query}"`
      : translateMessage(locale, 'product.products'),
  }
}

export function createCollectionListingPage({
  listing,
  locale,
  search,
}: {
  listing: CollectionListingResult | null
  locale: string
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
      translateMessage(locale, 'collection.collectionUnavailable'),
  }
}
