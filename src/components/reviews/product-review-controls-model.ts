import { selectedReviewFilterCount } from '@/lib/reviews/contracts'
import type {
  ProductReviewFilters,
  ProductReviewQuery,
  ProductReviewSort,
} from '@/lib/reviews/contracts'
import { formatNumber } from '@/components/shared/locale-format'
import { getReviewFilterDisplays } from './product-review-filter-display'
import type { ProductReviewFilterDisplay } from './product-review-filter-display'

export type ProductReviewSortDisplay = {
  label: string
  value: ProductReviewSort
}

export type ProductReviewControlsPresentationLabels = {
  clearFilters: string
  filterReviews: string
  sortBy: string
  sortOptions: Readonly<Record<ProductReviewSort, string>>
}

export type ProductReviewControlsPresentation = {
  clearFiltersLabel: string
  disabled: boolean
  filterButtonLabel: string
  filterOptions: ProductReviewFilterDisplay[]
  selectedFilterCountLabel?: string
  sortByLabel: string
  sortOptions: ProductReviewSortDisplay[]
  sortValue: ProductReviewSort
}

export function getProductReviewControlsPresentation({
  disabled,
  filters,
  labels,
  locale,
  query,
}: {
  disabled: boolean
  filters: ProductReviewFilters
  labels: ProductReviewControlsPresentationLabels
  locale: string
  query: ProductReviewQuery
}): ProductReviewControlsPresentation {
  const selectedCount = selectedReviewFilterCount(query)
  const sortOptions = filters.sortOptions.length
    ? filters.sortOptions
    : [filters.defaultSort]

  return {
    clearFiltersLabel: labels.clearFilters,
    disabled,
    filterButtonLabel: labels.filterReviews,
    filterOptions: getReviewFilterDisplays(filters, query),
    selectedFilterCountLabel: selectedCount
      ? `(${formatNumber(selectedCount, locale)})`
      : undefined,
    sortByLabel: labels.sortBy,
    sortOptions: sortOptions.map((value) => ({
      label: labels.sortOptions[value],
      value,
    })),
    sortValue: query.sort,
  }
}
