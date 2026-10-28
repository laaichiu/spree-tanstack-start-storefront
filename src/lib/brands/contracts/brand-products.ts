import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductSummary,
} from '@/lib/catalog/contracts'

export type BrandProductListingPage = {
  filters: ProductListingFilters | null
  meta: ProductListingMeta
  products: ProductSummary[]
}
