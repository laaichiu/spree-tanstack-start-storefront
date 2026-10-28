import type { ReactNode } from 'react'
import type { ProductReviewControlsPresentation } from '@/components/reviews/product-review-controls-model'
import type { ProductReviewSort } from '@/lib/reviews/contracts'

export type ProductReviewControlsActions = {
  clearFilters: () => void
  filterChange: (filterId: string, value: string) => void
  openFilterSheet: () => void
  sortChange: (value: ProductReviewSort) => void
}

export type ProductReviewControlsProps = {
  actions: ProductReviewControlsActions
  filterSheet: ReactNode
  model: ProductReviewControlsPresentation
}
