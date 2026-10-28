import type { ReactNode } from 'react'

import { ProductListingSortMenu } from '@/components/plp/product-listing-sort-menu'
import { getProductListingFilterToolbarDisplay } from './product-listing-filter-toolbar-model'
import { ProductListingFilterToolbarView } from './product-listing-filter-toolbar-view'
import type {
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingPriceRangeFilter,
  ProductListingSearch,
  ProductListingSort,
} from '@/lib/catalog/contracts'
import type { MessageKey } from '@/lib/i18n/messages'

type ProductListingFilterToolbarProps = {
  activeFilters?: ReactNode
  filtersUnavailable: boolean
  availabilityFilter: ProductListingAvailabilityFilter | null
  onPrepareDrawer: (sectionId?: string) => void
  onSortChange: (sort: ProductListingSort) => void
  optionFilters: ProductListingOptionFilter[]
  priceFilter: ProductListingPriceRangeFilter | null
  search: ProductListingSearch
  t: (key: MessageKey) => string
}

export function ProductListingFilterToolbar({
  activeFilters,
  availabilityFilter,
  filtersUnavailable,
  onPrepareDrawer,
  onSortChange,
  optionFilters,
  priceFilter,
  search,
  t,
}: ProductListingFilterToolbarProps) {
  const display = getProductListingFilterToolbarDisplay({
    availabilityFilter,
    labels: {
      availability: t('product.availability'),
      price: t('product.price'),
    },
    optionFilters,
    priceFilter,
    search,
  })
  const mobileSortMenu: ReactNode = (
    <ProductListingSortMenu
      className="h-10 px-4"
      onValueChange={onSortChange}
      t={t}
      value={search.sort}
    />
  )
  const desktopSortMenu: ReactNode = (
    <ProductListingSortMenu
      onValueChange={onSortChange}
      t={t}
      value={search.sort}
    />
  )

  return (
    <ProductListingFilterToolbarView
      actions={{
        filterClick: (filterId) => onPrepareDrawer(filterId),
        prepareDrawer: () => onPrepareDrawer(),
      }}
      appliedFilterCount={display.appliedFilterCount}
      filters={display.filters}
      hasAppliedFilters={display.hasAppliedFilters}
      mobileFilterLabel={t('product.filterAndSort')}
      unavailableMessage={
        filtersUnavailable ? t('product.filtersUnavailable') : undefined
      }
      slots={{
        activeFilters,
        desktopSort: desktopSortMenu,
        mobileSort: mobileSortMenu,
      }}
    />
  )
}
