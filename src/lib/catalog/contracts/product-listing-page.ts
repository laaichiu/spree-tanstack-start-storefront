import type { CategoryDetail } from './category'
import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductListingSearch,
} from './product-listing'
import type { ProductSummary } from './product'

export type ProductListingPageModel = {
  category: CategoryDetail | null
  description: string | null
  filters: ProductListingFilters | null
  kind: 'products' | 'collection'
  meta: ProductListingMeta | null
  products: ProductSummary[]
  search: ProductListingSearch
  status: 'ready' | 'error'
  title: string
}
