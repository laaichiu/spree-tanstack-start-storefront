export const PRODUCT_LISTING_SORT_VALUES = [
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'newest',
  'oldest',
  'best-selling',
] as const

export type ProductListingSort = (typeof PRODUCT_LISTING_SORT_VALUES)[number]

export const DEFAULT_PRODUCT_LISTING_SORT: ProductListingSort = 'newest'

export const PRODUCT_LISTING_AVAILABILITY_VALUES = [
  'in_stock',
  'out_of_stock',
] as const

export type ProductListingAvailability =
  (typeof PRODUCT_LISTING_AVAILABILITY_VALUES)[number]

export type ProductListingSearch = {
  q?: string
  page: number
  limit: number
  sort: ProductListingSort
  option: string[]
  availability?: ProductListingAvailability
  price_min?: number
  price_max?: number
}

export type ProductListingMeta = {
  page: number
  limit: number
  count: number
  pages: number
  from: number
  to: number
}

export type ProductListingOptionFilterOption = {
  id: string
  count: number
  name: string
  label: string
  colorCode: string | null
  imageUrl: string | null
}

export type ProductListingOptionFilter = {
  id: string
  type: 'option'
  name: string
  label: string
  kind: string
  options: ProductListingOptionFilterOption[]
}

export type ProductListingPriceRangeFilter = {
  id: 'price'
  type: 'price_range'
  min: number
  max: number
  currency: string
}

export type ProductListingAvailabilityFilterOption = {
  id: ProductListingAvailability
  count: number
}

export type ProductListingAvailabilityFilter = {
  id: 'availability'
  type: 'availability'
  options: ProductListingAvailabilityFilterOption[]
}

export type ProductListingFilter =
  | ProductListingAvailabilityFilter
  | ProductListingOptionFilter
  | ProductListingPriceRangeFilter

export type ProductListingFilters = {
  filters: ProductListingFilter[]
  sortOptions: string[]
  defaultSort: string
  totalCount: number
}

export const DEFAULT_PRODUCT_LISTING_SEARCH: ProductListingSearch = {
  page: 1,
  limit: 24,
  sort: DEFAULT_PRODUCT_LISTING_SORT,
  option: [],
}
