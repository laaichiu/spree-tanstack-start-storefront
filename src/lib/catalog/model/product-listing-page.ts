import type { CategoryDetail } from '@/lib/catalog/model/category'
import type {
  ProductListingFilters,
  ProductListingMeta,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'
import type { ProductSummary } from '@/lib/catalog/model/product'

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
