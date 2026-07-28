import {
  FilterAccordionItem,
  RadioIndicator,
} from '@/components/plp/product-listing-filter-ui'
import { ProductListingFilterOptions } from '@/components/plp/product-listing-filter-options'
import {
  getAvailabilityLabel,
  getFilterSelectionCount,
} from '@/components/plp/product-listing-filter-utils'
import type { PriceBucket } from '@/components/plp/product-listing-filter-utils'
import type {
  ProductListingAvailability,
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'

export function ProductListingOptionFilterSection({
  draft,
  expandedSection,
  filter,
  onToggleDraftOption,
  onToggleSection,
}: {
  draft: ProductListingSearch
  expandedSection: string | null
  filter: ProductListingOptionFilter
  onToggleDraftOption: (optionId: string) => void
  onToggleSection: (sectionId: string) => void
}) {
  const activeCount = getFilterSelectionCount(filter, draft.option)

  return (
    <FilterAccordionItem
      activeCount={activeCount || undefined}
      isOpen={expandedSection === filter.id}
      label={filter.label}
      onToggle={() => onToggleSection(filter.id)}
    >
      <ProductListingFilterOptions
        draft={draft}
        filter={filter}
        onToggleDraftOption={onToggleDraftOption}
      />
    </FilterAccordionItem>
  )
}

export function ProductListingPriceFilterSection({
  draftPriceBucket,
  expandedSection,
  onSetDraftPrice,
  onToggleSection,
  priceBuckets,
  t,
}: {
  draftPriceBucket?: PriceBucket
  expandedSection: string | null
  onSetDraftPrice: (min?: number, max?: number) => void
  onToggleSection: (sectionId: string) => void
  priceBuckets: PriceBucket[]
  t: (key: MessageKey) => string
}) {
  return (
    <FilterAccordionItem
      activeCount={draftPriceBucket ? 1 : undefined}
      isOpen={expandedSection === 'price'}
      label={t('product.price')}
      onToggle={() => onToggleSection('price')}
    >
      <div className="space-y-2">
        <button
          className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
          onClick={() => onSetDraftPrice(undefined, undefined)}
          type="button"
        >
          <RadioIndicator selected={!draftPriceBucket} />
          <span className="flex-1">{t('product.anyPrice')}</span>
        </button>
        {priceBuckets.map((bucket) => {
          const isSelected = draftPriceBucket?.id === bucket.id

          return (
            <button
              className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
              key={bucket.id}
              onClick={() => onSetDraftPrice(bucket.min, bucket.max)}
              type="button"
            >
              <RadioIndicator selected={isSelected} />
              <span className="flex-1">{bucket.label}</span>
            </button>
          )
        })}
      </div>
    </FilterAccordionItem>
  )
}

export function ProductListingAvailabilityFilterSection({
  availabilityFilter,
  draft,
  expandedSection,
  onSetDraftAvailability,
  onToggleSection,
  t,
}: {
  availabilityFilter: ProductListingAvailabilityFilter
  draft: ProductListingSearch
  expandedSection: string | null
  onSetDraftAvailability: (availability?: ProductListingAvailability) => void
  onToggleSection: (sectionId: string) => void
  t: (key: MessageKey) => string
}) {
  return (
    <FilterAccordionItem
      activeCount={draft.availability ? 1 : undefined}
      isOpen={expandedSection === 'availability'}
      label={t('product.availability')}
      onToggle={() => onToggleSection('availability')}
    >
      <div className="space-y-2">
        <button
          className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
          onClick={() => onSetDraftAvailability(undefined)}
          type="button"
        >
          <RadioIndicator selected={!draft.availability} />
          <span className="flex-1">{t('product.anyAvailability')}</span>
        </button>
        {availabilityFilter.options.map((option) => {
          const isSelected = draft.availability === option.id

          return (
            <button
              className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
              key={option.id}
              onClick={() => onSetDraftAvailability(option.id)}
              type="button"
            >
              <RadioIndicator selected={isSelected} />
              <span className="flex-1">
                {getAvailabilityLabel(option.id, {
                  inStock: t('product.inStock'),
                  outOfStock: t('product.outOfStock'),
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                {option.count}
              </span>
            </button>
          )
        })}
      </div>
    </FilterAccordionItem>
  )
}
