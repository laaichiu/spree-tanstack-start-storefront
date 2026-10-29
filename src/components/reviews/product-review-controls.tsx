import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductReviewFilters,
  ProductReviewQuery,
} from '@/lib/reviews/contracts'
import {
  cloneProductReviewQuery,
  clearReviewFilters,
  setReviewFilterValue,
} from '@/lib/reviews/contracts'
import { getProductReviewControlsPresentation } from './product-review-controls-model'
import { getVisibleReviewFilters } from './product-review-filter-display'

import { ProductReviewControlsView } from './product-review-controls-view'
import { useProductReviewDraftSheet } from './use-product-review-draft-sheet'
import { ProductReviewFilterSheet } from './product-review-filter-sheet'

export function ProductReviewControls({
  disabled = false,
  filters,
  onChange,
  onClear,
  query,
}: {
  disabled?: boolean
  filters: ProductReviewFilters
  onChange: (next: ProductReviewQuery) => void
  onClear: () => void
  query: ProductReviewQuery
}) {
  const { market, t } = useMarket()
  const {
    draft: draftQuery,
    isOpen: filterSheetOpen,
    open: openFilterSheet,
    setDraft: setDraftQuery,
    setOpen: setFilterSheetOpen,
  } = useProductReviewDraftSheet({
    clone: cloneProductReviewQuery,
    value: query,
  })
  const reviewFilters = getVisibleReviewFilters(filters)

  return (
    <ProductReviewControlsView
      filterSheet={
        reviewFilters.length ? (
          <ProductReviewFilterSheet
            disabled={disabled}
            draftQuery={draftQuery}
            filters={reviewFilters}
            onApply={() => {
              onChange({ ...draftQuery, page: 1 })
              setFilterSheetOpen(false)
            }}
            onClear={() => setDraftQuery(clearReviewFilters(draftQuery))}
            onDraftFilterChange={(filterId, value) =>
              setDraftQuery((current) =>
                setReviewFilterValue(current, filterId, value),
              )
            }
            onOpenChange={setFilterSheetOpen}
            open={filterSheetOpen}
          />
        ) : null
      }
      model={getProductReviewControlsPresentation({
        disabled,
        filters,
        labels: {
          allReviews: t('reviews.allReviews'),
          clearFilters: t('reviews.clearFilters'),
          filterReviews: t('reviews.filterReviews'),
          sortBy: t('reviews.sortBy'),
          sortOptions: {
            highest_rating: t('reviews.sortHighestRating'),
            lowest_rating: t('reviews.sortLowestRating'),
            most_helpful: t('reviews.sortMostHelpful'),
            most_recent: t('reviews.sortMostRecent'),
          },
        },
        locale: market.locale,
        query,
      })}
      actions={{
        clearFilters: onClear,
        filterChange: (filterId, value) =>
          onChange(setReviewFilterValue(query, filterId, value)),
        openFilterSheet,
        sortChange: (value) =>
          onChange({
            ...query,
            page: 1,
            sort: value,
          }),
      }}
    />
  )
}
