import {
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ProductListingAvailabilityFilterSection,
  ProductListingOptionFilterSection,
  ProductListingPriceFilterSection,
} from '@/components/plp/product-listing-filter-sections'
import type { PriceBucket } from '@/components/plp/product-listing-filter-utils'
import type {
  ProductListingAvailability,
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'

type ProductListingFilterDrawerProps = {
  availabilityFilter: ProductListingAvailabilityFilter | null
  draft: ProductListingSearch
  draftFilterCount: number
  draftPriceBucket?: PriceBucket
  expandedSection: string | null
  hasPriceFilter: boolean
  onApplyDraft: () => void
  onClearDraft: () => void
  onSetDraftAvailability: (availability?: ProductListingAvailability) => void
  onSetDraftPrice: (min?: number, max?: number) => void
  onToggleDraftOption: (optionId: string) => void
  onToggleSection: (sectionId: string) => void
  optionFilters: ProductListingOptionFilter[]
  priceBuckets: PriceBucket[]
  productCountLabel: string
  t: (key: MessageKey) => string
}

export function ProductListingFilterDrawer({
  availabilityFilter,
  draft,
  draftFilterCount,
  draftPriceBucket,
  expandedSection,
  hasPriceFilter,
  onApplyDraft,
  onClearDraft,
  onSetDraftAvailability,
  onSetDraftPrice,
  onToggleDraftOption,
  onToggleSection,
  optionFilters,
  priceBuckets,
  productCountLabel,
  t,
}: ProductListingFilterDrawerProps) {
  return (
    <SheetContent className="shadow-none" side="left">
      <SheetHeader className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-border px-5 py-4">
        <SheetTitle>{t('product.filterAndSort')}</SheetTitle>
        <p className="text-sm leading-none tracking-wider text-muted-foreground uppercase">
          {productCountLabel}
        </p>
        <SheetCloseButton
          aria-label={t('product.closeFilters')}
          className="-mr-1 flex h-8 w-8 items-center justify-center"
        />
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5">
        {optionFilters.map((filter) => (
          <ProductListingOptionFilterSection
            draft={draft}
            expandedSection={expandedSection}
            filter={filter}
            key={filter.id}
            onToggleDraftOption={onToggleDraftOption}
            onToggleSection={onToggleSection}
          />
        ))}

        {hasPriceFilter ? (
          <ProductListingPriceFilterSection
            draftPriceBucket={draftPriceBucket}
            expandedSection={expandedSection}
            onSetDraftPrice={onSetDraftPrice}
            onToggleSection={onToggleSection}
            priceBuckets={priceBuckets}
            t={t}
          />
        ) : null}

        {availabilityFilter ? (
          <ProductListingAvailabilityFilterSection
            availabilityFilter={availabilityFilter}
            draft={draft}
            expandedSection={expandedSection}
            onSetDraftAvailability={onSetDraftAvailability}
            onToggleSection={onToggleSection}
            t={t}
          />
        ) : null}
      </div>

      <footer className="grid grid-cols-1 gap-2 border-t border-border p-4 sm:grid-cols-2">
        <button
          className="h-12 border border-input px-4 text-sm font-normal tracking-wider text-foreground uppercase transition-colors hover:border-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-40"
          disabled={draftFilterCount === 0}
          onClick={onClearDraft}
          type="button"
        >
          {t('product.clearAll')}
        </button>
        <button
          className="h-12 bg-primary px-4 text-sm font-normal tracking-wider text-primary-foreground uppercase transition hover:brightness-95 focus-visible:focus-ring"
          onClick={onApplyDraft}
          type="button"
        >
          {t('product.showResults')}
        </button>
      </footer>
    </SheetContent>
  )
}
