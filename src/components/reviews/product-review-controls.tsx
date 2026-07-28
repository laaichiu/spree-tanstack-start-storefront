import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { NativeSelect } from '@/components/ui/native-select'
import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductReviewFilters,
  ProductReviewQuery,
  ProductReviewSort,
} from '@/lib/reviews/model/product-review'

import { ProductReviewFilterSheet } from './product-review-filter-sheet'
import {
  clearReviewFilters,
  getReviewFilterValue,
  getVisibleReviewFilters,
  getVisibleReviewFilterValues,
  selectedReviewFilterCount,
  setReviewFilterValue,
} from './review-filter-query'

function getSortLabel(
  sort: ProductReviewSort,
  t: ReturnType<typeof useMarket>['t'],
) {
  switch (sort) {
    case 'highest_rating':
      return t('reviews.sortHighestRating')
    case 'lowest_rating':
      return t('reviews.sortLowestRating')
    case 'most_helpful':
      return t('reviews.sortMostHelpful')
    default:
      return t('reviews.sortMostRecent')
  }
}

function cloneReviewQuery(query: ProductReviewQuery): ProductReviewQuery {
  return {
    ...query,
    answerFilters: Object.fromEntries(
      Object.entries(query.answerFilters).map(([key, values]) => [
        key,
        values ? [...values] : values,
      ]),
    ),
    ratings: [...query.ratings],
  }
}

const pillSelectClassName =
  'h-11 rounded-full py-0 pr-10 pl-5 text-lg leading-5 font-normal normal-case'

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
  const { t } = useMarket()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [draftQuery, setDraftQuery] = useState<ProductReviewQuery>(() =>
    cloneReviewQuery(query),
  )
  const reviewFilters = getVisibleReviewFilters(filters)
  const selectedFilterCount = selectedReviewFilterCount(query)
  const sortOptions = filters.sortOptions.length
    ? filters.sortOptions
    : [filters.defaultSort]

  function openFilterSheet() {
    setDraftQuery(cloneReviewQuery(query))
    setFilterSheetOpen(true)
  }

  return (
    <div>
      <div
        className={
          reviewFilters.length
            ? 'grid grid-cols-2 gap-3 md:hidden'
            : 'md:hidden'
        }
      >
        {reviewFilters.length ? (
          <button
            className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm text-foreground transition-colors hover:border-foreground focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-55"
            disabled={disabled}
            onClick={openFilterSheet}
            type="button"
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
            />
            <span className="truncate">{t('reviews.filterReviews')}</span>
            {selectedFilterCount ? (
              <span className="shrink-0 text-muted-foreground">
                ({selectedFilterCount})
              </span>
            ) : null}
          </button>
        ) : null}

        <NativeSelect
          className={pillSelectClassName}
          disabled={disabled}
          id="reviews-sort-mobile"
          label={t('reviews.sortBy')}
          labelClassName="sr-only"
          onValueChange={(value) =>
            onChange({
              ...query,
              page: 1,
              sort: value as ProductReviewSort,
            })
          }
          options={sortOptions.map((sort) => ({
            label: getSortLabel(sort, t),
            value: sort,
          }))}
          value={query.sort}
        />

        {selectedFilterCount ? (
          <button
            className="col-span-2 justify-self-start text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
            disabled={disabled}
            onClick={onClear}
            type="button"
          >
            {t('reviews.clearFilters')}
          </button>
        ) : null}
      </div>

      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex flex-wrap gap-3">
          {reviewFilters.map((filter) => (
            <div className="min-w-44" key={filter.id}>
              <NativeSelect
                className={pillSelectClassName}
                disabled={disabled}
                id={`reviews-${filter.id}`}
                label={filter.label}
                labelClassName="sr-only"
                onValueChange={(value) =>
                  onChange(setReviewFilterValue(query, filter.id, value))
                }
                options={[
                  { label: filter.label, value: '' },
                  ...getVisibleReviewFilterValues(filter).map((value) => ({
                    label: value.label,
                    value: value.value,
                  })),
                ]}
                value={getReviewFilterValue(query, filter.id)}
              />
            </div>
          ))}

          {selectedFilterCount ? (
            <button
              className="h-11 rounded-full border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground focus-visible:focus-ring"
              disabled={disabled}
              onClick={onClear}
              type="button"
            >
              {t('reviews.clearFilters')}
            </button>
          ) : null}
        </div>

        <div className="w-52 shrink-0">
          <NativeSelect
            className={pillSelectClassName}
            disabled={disabled}
            id="reviews-sort"
            label={t('reviews.sortBy')}
            labelClassName="sr-only"
            onValueChange={(value) =>
              onChange({
                ...query,
                page: 1,
                sort: value as ProductReviewSort,
              })
            }
            options={sortOptions.map((sort) => ({
              label: getSortLabel(sort, t),
              value: sort,
            }))}
            value={query.sort}
          />
        </div>
      </div>

      {reviewFilters.length ? (
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
      ) : null}
    </div>
  )
}
