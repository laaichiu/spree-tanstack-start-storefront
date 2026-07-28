import { Sheet } from '@/components/ui/sheet'
import { ProductListingActiveFilters } from '@/components/plp/product-listing-active-filters'
import { ProductListingFilterDrawer } from '@/components/plp/product-listing-filter-drawer'
import { ProductListingFilterToolbar } from '@/components/plp/product-listing-filter-toolbar'
import type {
  ProductListingFilters,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'

import { useProductListingFilterState } from './use-product-listing-filter-state'

type ProductListingControlsProps = {
  filters: ProductListingFilters | null
  onApply: (search: ProductListingSearch) => void
  search: ProductListingSearch
  totalCount: number
}

export function ProductListingControls({
  filters,
  onApply,
  search,
  totalCount,
}: ProductListingControlsProps) {
  const {
    activeOptionMetaById,
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
    productCountLabel,
    t,
    applyDraft,
    clearAppliedFilters,
    clearDraftFilters,
    prepareDrawer,
    removeAppliedAvailability,
    removeAppliedOption,
    removeAppliedPrice,
    setDraftAvailability,
    setDraftPrice,
    setIsOpen,
    setSort,
    toggleAccordionSection,
    toggleDraftOption,
  } = useProductListingFilterState({
    filters,
    onApply,
    search,
    totalCount,
  })

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <ProductListingFilterToolbar
        appliedFilterCount={appliedFilterCount}
        availabilityFilter={availabilityFilter}
        className="mt-7"
        onPrepareDrawer={prepareDrawer}
        onSortChange={setSort}
        optionFilters={optionFilters}
        priceFilter={priceFilter}
        search={search}
        t={t}
      />

      {appliedFilterCount > 0 ? (
        <div className="mt-5">
          <ProductListingActiveFilters
            activeOptionMetaById={activeOptionMetaById}
            appliedPriceBucket={appliedPriceBucket}
            onClearAll={clearAppliedFilters}
            onRemoveAvailability={removeAppliedAvailability}
            onRemoveOption={removeAppliedOption}
            onRemovePrice={removeAppliedPrice}
            search={search}
            t={t}
          />
        </div>
      ) : null}

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
        onToggleSection={toggleAccordionSection}
        optionFilters={optionFilters}
        priceBuckets={priceBuckets}
        productCountLabel={productCountLabel}
        t={t}
      />
    </Sheet>
  )
}
