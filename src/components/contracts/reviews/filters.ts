import type { ProductReviewFilterSectionDisplay } from '@/components/reviews/product-review-filter-display'

export type ProductReviewFilterSheetModel = {
  clearDisabled: boolean
  disabled: boolean
  headerCountLabel: string
  labels: {
    applyFilters: string
    clearFilters: string
    closeFilters: string
    filterReviews: string
  }
  open: boolean
  sections: readonly ProductReviewFilterSectionDisplay[]
}

export type ProductReviewFilterSheetActions = {
  apply: () => void
  clear: () => void
  draftFilterChange: (filterId: string, value: string) => void
  openChange: (open: boolean) => void
}
