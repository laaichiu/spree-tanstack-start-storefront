import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductReviewFilter,
  ProductReviewQuery,
} from '@/lib/reviews/contracts'
import { selectedReviewFilterCount } from '@/lib/reviews/contracts'
import { getReviewFilterSectionDisplays } from './product-review-filter-display'

import { ProductReviewFilterSheetView } from './product-review-filter-sheet-view'

export function ProductReviewFilterSheet({
  disabled,
  draftQuery,
  filters,
  onApply,
  onClear,
  onDraftFilterChange,
  onOpenChange,
  open,
}: {
  disabled: boolean
  draftQuery: ProductReviewQuery
  filters: ProductReviewFilter[]
  onApply: () => void
  onClear: () => void
  onDraftFilterChange: (filterId: string, value: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const { t } = useMarket()
  const allReviewsLabel = t('reviews.allReviews')
  const selectedFilterCount = selectedReviewFilterCount(draftQuery)

  return (
    <ProductReviewFilterSheetView
      model={{
        clearDisabled: selectedFilterCount === 0,
        disabled,
        labels: {
          applyFilters: t('reviews.applyFilters'),
          clearFilters: t('reviews.clearFilters'),
          closeFilters: t('reviews.closeFilters'),
          filterReviews: t('reviews.filterReviews'),
        },
        open,
        sections: getReviewFilterSectionDisplays(
          filters,
          draftQuery,
          allReviewsLabel,
        ),
      }}
      actions={{
        apply: onApply,
        clear: onClear,
        draftFilterChange: onDraftFilterChange,
        openChange: onOpenChange,
      }}
    />
  )
}
