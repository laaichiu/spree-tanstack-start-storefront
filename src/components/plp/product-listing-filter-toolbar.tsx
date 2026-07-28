import { SlidersHorizontal } from 'lucide-react'

import { SheetTrigger } from '@/components/ui/sheet'
import {
  FilterToolbarButton,
  getFilterButtonClassName,
} from '@/components/plp/product-listing-filter-ui'
import { getFilterSelectionCount } from '@/components/plp/product-listing-filter-utils'
import { ProductListingSortMenu } from '@/components/plp/product-listing-sort-menu'
import type {
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingPriceRangeFilter,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/lib/utils'

type ProductListingFilterToolbarProps = {
  appliedFilterCount: number
  availabilityFilter: ProductListingAvailabilityFilter | null
  className?: string
  onPrepareDrawer: (sectionId?: string) => void
  onSortChange: (sort: ProductListingSort) => void
  optionFilters: ProductListingOptionFilter[]
  priceFilter: ProductListingPriceRangeFilter | null
  search: ProductListingSearch
  t: (key: MessageKey) => string
}

export function ProductListingFilterToolbar({
  appliedFilterCount,
  availabilityFilter,
  className,
  onPrepareDrawer,
  onSortChange,
  optionFilters,
  priceFilter,
  search,
  t,
}: ProductListingFilterToolbarProps) {
  const hasAppliedFilters = appliedFilterCount > 0

  return (
    <div
      className={cn(
        "top-storefront-mobile-header sticky z-20 -mx-4 flex flex-col gap-4 border-b border-border bg-background px-4 py-2 md:sticky md:mx-0 md:border-0 md:bg-background md:px-0 md:py-0 md:top-[8.25rem] md:before:pointer-events-none md:before:absolute md:before:inset-x-0 md:before:bottom-full md:before:h-7 md:before:bg-background md:before:content-[''] lg:top-[6.75rem]",
        !hasAppliedFilters &&
          "md:after:pointer-events-none md:after:absolute md:after:inset-x-0 md:after:top-full md:after:h-8 md:after:bg-background md:after:content-['']",
        className,
      )}
      data-product-listing-toolbar=""
    >
      <div className="flex items-center justify-between gap-4 md:hidden">
        <SheetTrigger
          className={getFilterButtonClassName(hasAppliedFilters, 'h-10 px-4')}
          onClick={() => onPrepareDrawer()}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{t('product.filterAndSort')}</span>
          {hasAppliedFilters ? (
            <span className="text-sm">({appliedFilterCount})</span>
          ) : null}
        </SheetTrigger>
        <ProductListingSortMenu
          className="h-10 px-4"
          onValueChange={onSortChange}
          t={t}
          value={search.sort}
        />
      </div>

      <div className="hidden items-start justify-between gap-6 md:flex">
        <div className="flex flex-wrap gap-2">
          {optionFilters.map((filter) => {
            const selectedCount = getFilterSelectionCount(filter, search.option)

            return (
              <FilterToolbarButton
                badgeCount={selectedCount || undefined}
                isActive={selectedCount > 0}
                key={filter.id}
                label={filter.label}
                onClick={() => onPrepareDrawer(filter.id)}
              />
            )
          })}

          {priceFilter ? (
            <FilterToolbarButton
              badgeCount={
                search.price_min !== undefined || search.price_max !== undefined
                  ? 1
                  : undefined
              }
              isActive={Boolean(
                search.price_min !== undefined ||
                search.price_max !== undefined,
              )}
              label={t('product.price')}
              onClick={() => onPrepareDrawer('price')}
            />
          ) : null}

          {availabilityFilter ? (
            <FilterToolbarButton
              badgeCount={search.availability ? 1 : undefined}
              isActive={Boolean(search.availability)}
              label={t('product.availability')}
              onClick={() => onPrepareDrawer('availability')}
            />
          ) : null}

          <FilterToolbarButton
            badgeCount={appliedFilterCount || undefined}
            isActive={hasAppliedFilters}
            label={t('product.allFilters')}
            onClick={() => onPrepareDrawer()}
          />
        </div>

        <ProductListingSortMenu
          onValueChange={onSortChange}
          t={t}
          value={search.sort}
        />
      </div>
    </div>
  )
}
