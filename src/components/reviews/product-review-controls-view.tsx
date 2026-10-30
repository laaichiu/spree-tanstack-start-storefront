import { SlidersHorizontal } from 'lucide-react'

import { NativeSelect } from '@/components/ui/native-select'
import type { ProductReviewControlsProps } from '../contracts/reviews'

export type {
  ProductReviewControlsActions,
  ProductReviewControlsProps,
} from '../contracts/reviews'

const pillSelectClassName =
  'h-11 rounded-full py-0 pr-10 pl-5 text-sm leading-5 font-normal normal-case'

export function ProductReviewControlsView({
  actions,
  filterSheet,
  model,
}: ProductReviewControlsProps) {
  const {
    clearFiltersLabel,
    disabled,
    filterButtonLabel,
    filterOptions,
    selectedFilterCountLabel,
    sortByLabel,
    sortOptions,
    sortValue,
  } = model

  function handleSortChange(value: string) {
    const option = sortOptions.find((sortOption) => sortOption.value === value)

    if (option) {
      actions.sortChange(option.value)
    }
  }

  return (
    <div>
      <div
        className={
          filterOptions.length
            ? 'grid grid-cols-2 gap-3 md:hidden'
            : 'md:hidden'
        }
      >
        {filterOptions.length ? (
          <button
            className="inline-flex h-11 min-w-0 items-center justify-center gap-1 rounded-full border border-border bg-background px-3 text-sm leading-5 text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-55"
            disabled={disabled}
            onClick={actions.openFilterSheet}
            type="button"
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
            />
            <span className="truncate">{filterButtonLabel}</span>
            {selectedFilterCountLabel && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {selectedFilterCountLabel}
              </span>
            )}
          </button>
        ) : null}

        <NativeSelect
          className={pillSelectClassName}
          disabled={disabled}
          id="reviews-sort-mobile"
          label={sortByLabel}
          labelClassName="sr-only"
          onValueChange={handleSortChange}
          options={sortOptions}
          value={sortValue}
        />
      </div>

      <div className="hidden items-start justify-between gap-4 md:flex">
        <div className="flex min-w-0 flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <div className="min-w-0 max-w-full sm:min-w-44" key={filter.id}>
              <NativeSelect
                className={pillSelectClassName}
                disabled={disabled}
                id={`reviews-${filter.id}`}
                label={filter.label}
                labelClassName="sr-only"
                onValueChange={(value) =>
                  actions.filterChange(filter.id, value)
                }
                options={filter.options}
                value={filter.value}
              />
            </div>
          ))}

          {selectedFilterCountLabel && (
            <button
              className="h-11 rounded-full border border-border px-5 text-xs text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              disabled={disabled}
              onClick={actions.clearFilters}
              type="button"
            >
              {clearFiltersLabel}
            </button>
          )}
        </div>

        <div className="w-52 max-w-[40%] shrink-0">
          <NativeSelect
            className={pillSelectClassName}
            disabled={disabled}
            id="reviews-sort"
            label={sortByLabel}
            labelClassName="sr-only"
            onValueChange={handleSortChange}
            options={sortOptions}
            value={sortValue}
          />
        </div>
      </div>

      {filterSheet}
    </div>
  )
}
