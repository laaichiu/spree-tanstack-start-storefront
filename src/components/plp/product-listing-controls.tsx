import { lazy, Suspense, useState } from 'react'

import { ProductListingActiveFilters } from '@/components/plp/product-listing-active-filters'
import { ProductListingFilterToolbar } from '@/components/plp/product-listing-filter-toolbar'
import type {
  ProductListingFilters,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import { ProductListingControlsView } from './product-listing-controls-view'

import { useProductListingFilterState } from './use-product-listing-filter-state'

const ProductListingFilterDrawer = lazy(async () => {
  const module = await import('./product-listing-filter-drawer')
  return { default: module.ProductListingFilterDrawer }
})

type ProductListingControlsProps = {
  filters: ProductListingFilters | null
  onApply: (search: ProductListingSearch) => void
  search: ProductListingSearch
}

export function ProductListingControls({
  filters,
  onApply,
  search,
}: ProductListingControlsProps) {
  const [hasOpenedDrawer, setHasOpenedDrawer] = useState(false)
  const {
    appliedFilterCount,
    appliedPriceBucket,
    availabilityFilter,
    draft,
    draftFilterCount,
    draftPriceBucket,
    expandedSection,
    isOpen,
    optionFilters,
    priceBuckets,
    priceFilter,
    t,
    applyDraft,
    clearAppliedFilters,
    clearDraftFilters,
    prepareDrawer: prepareFilterDrawer,
    removeAppliedAvailability,
    removeAppliedOption,
    removeAppliedPrice,
    setDraftAvailability,
    setDraftPrice,
    setIsOpen,
    setSort,
    toggleSection,
    toggleDraftOption,
  } = useProductListingFilterState({
    filters,
    onApply,
    search,
  })

  function prepareDrawer(sectionId?: string) {
    setHasOpenedDrawer(true)
    prepareFilterDrawer(sectionId)
  }

  const activeFilters =
    appliedFilterCount > 0 ? (
      <ProductListingActiveFilters
        appliedPriceBucket={appliedPriceBucket}
        optionFilters={optionFilters}
        onClearAll={clearAppliedFilters}
        onRemoveAvailability={removeAppliedAvailability}
        onRemoveOption={removeAppliedOption}
        onRemovePrice={removeAppliedPrice}
        search={search}
        t={t}
      />
    ) : null

  return (
    <ProductListingControlsView
      onOpenChange={setIsOpen}
      open={isOpen}
      slots={{
        filterDrawer: hasOpenedDrawer ? (
          <Suspense fallback={null}>
            <ProductListingFilterDrawer
              availabilityFilter={availabilityFilter}
              draft={draft}
              draftFilterCount={draftFilterCount}
              draftPriceBucket={draftPriceBucket}
              expandedSection={expandedSection}
              hasPriceFilter={Boolean(priceFilter)}
              onApplyDraft={applyDraft}
              onClearDraft={clearDraftFilters}
              onSetDraftAvailability={setDraftAvailability}
              onSetDraftPrice={setDraftPrice}
              onToggleDraftOption={toggleDraftOption}
              onToggleSection={toggleSection}
              optionFilters={optionFilters}
              priceBuckets={priceBuckets}
              t={t}
            />
          </Suspense>
        ) : null,
        filterToolbar: (
          <ProductListingFilterToolbar
            availabilityFilter={availabilityFilter}
            filtersUnavailable={filters === null}
            activeFilters={activeFilters}
            onPrepareDrawer={prepareDrawer}
            onSortChange={setSort}
            optionFilters={optionFilters}
            priceFilter={priceFilter}
            search={search}
            t={t}
          />
        ),
      }}
    />
  )
}
