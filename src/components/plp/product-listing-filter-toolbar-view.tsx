import { SlidersHorizontal } from 'lucide-react'

import { SheetTrigger } from '@/components/ui/sheet'

import {
  getFilterButtonClassName,
  FilterToolbarButtonView,
} from './product-listing-filter-ui-view'
import type {
  ProductListingFilterToolbarActions,
  ProductListingFilterToolbarSlots,
} from '../contracts/catalog'

export type {
  ProductListingFilterToolbarActions,
  ProductListingFilterToolbarSlots,
} from '../contracts/catalog'

export type ProductListingFilterToolbarOption = {
  badgeCount?: number
  id: string
  isActive?: boolean
  label: string
}

const toolbarClassName =
  'sticky top-26 z-20 -mx-4 flex flex-col border-b border-border bg-background px-4 py-4 lg:-mx-8 lg:px-8 xl:top-20 max-xl:landscape:static'

export function ProductListingFilterToolbarView({
  actions,
  appliedFilterCount,
  filters,
  hasAppliedFilters,
  mobileFilterLabel,
  unavailableMessage,
  slots,
}: {
  actions: ProductListingFilterToolbarActions
  appliedFilterCount: number
  filters: ProductListingFilterToolbarOption[]
  hasAppliedFilters: boolean
  mobileFilterLabel: string
  unavailableMessage?: string
  slots: ProductListingFilterToolbarSlots
}) {
  return (
    <div className={toolbarClassName} data-product-listing-toolbar="">
      <div className="flex items-center justify-between gap-4 md:hidden">
        <SheetTrigger
          className={getFilterButtonClassName(hasAppliedFilters, 'h-10 px-4')}
          disabled={Boolean(unavailableMessage) && filters.length === 0}
          onClick={actions.prepareDrawer}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          <span>{mobileFilterLabel}</span>
          {hasAppliedFilters ? (
            <span className="text-xs">({appliedFilterCount})</span>
          ) : null}
        </SheetTrigger>
        {slots.mobileSort}
      </div>

      <div className="hidden items-center justify-between gap-6 md:flex">
        <div
          className="flex w-full items-center justify-between gap-6"
          data-product-listing-toolbar-content=""
        >
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterToolbarButtonView
                badgeCount={filter.badgeCount}
                isActive={filter.isActive}
                key={filter.id}
                label={filter.label}
                onClick={() => actions.filterClick(filter.id)}
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center">{slots.desktopSort}</div>
        </div>
      </div>

      {unavailableMessage ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          {unavailableMessage}
        </p>
      ) : null}

      {slots.activeFilters ? (
        <div className="mt-4">{slots.activeFilters}</div>
      ) : null}
    </div>
  )
}
