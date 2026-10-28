import { getProductListingPriceFilterChoiceDisplays } from './product-listing-price-filter-model'
import { getProductListingAvailabilityFilterChoiceDisplays } from './product-listing-availability-filter-model'
import { getProductListingFilterDisplay } from './product-listing-option-filter-display'
import { getFilterSelectionCount } from '@/lib/catalog/contracts'
import type {
  ProductListingAvailability,
  ProductListingAvailabilityFilter,
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { ProductListingPriceBucketDisplay } from './product-listing-price-filter-model'
import type { MessageKey } from '@/lib/i18n/messages'
import {
  ProductListingChoiceFilterSectionView,
  ProductListingOptionFilterSectionView,
} from './product-listing-filter-sections-view'
import { ProductListingFilterDrawerView } from './product-listing-filter-drawer-view'

type ProductListingFilterDrawerProps = {
  availabilityFilter: ProductListingAvailabilityFilter | null
  draft: ProductListingSearch
  draftFilterCount: number
  draftPriceBucket?: ProductListingPriceBucketDisplay
  expandedSection: string | null
  hasPriceFilter: boolean
  onApplyDraft: () => void
  onClearDraft: () => void
  onSetDraftAvailability: (availability?: ProductListingAvailability) => void
  onSetDraftPrice: (min?: number, max?: number) => void
  onToggleDraftOption: (optionId: string) => void
  onToggleSection: (sectionId: string) => void
  optionFilters: ProductListingOptionFilter[]
  priceBuckets: ProductListingPriceBucketDisplay[]
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
  t,
}: ProductListingFilterDrawerProps) {
  const priceChoices = getProductListingPriceFilterChoiceDisplays({
    anyLabel: t('product.anyPrice'),
    buckets: priceBuckets,
    selectedBucketId: draftPriceBucket?.id,
  })
  return (
    <ProductListingFilterDrawerView
      actions={{
        apply: onApplyDraft,
        clear: onClearDraft,
      }}
      canClear={draftFilterCount > 0}
      clearAllLabel={t('product.clearAll')}
      closeLabel={t('product.closeFilters')}
      sections={
        <>
          {optionFilters.map((filter) => (
            <ProductListingOptionFilterSectionView
              activeCount={
                getFilterSelectionCount(filter, draft.option) || undefined
              }
              filter={getProductListingFilterDisplay(filter)}
              isOpen={expandedSection === filter.id}
              key={filter.id}
              label={filter.label}
              onToggle={() => onToggleSection(filter.id)}
              onToggleOption={onToggleDraftOption}
              selectedOptionIds={draft.option}
            />
          ))}

          {hasPriceFilter ? (
            <ProductListingChoiceFilterSectionView
              activeCount={draftPriceBucket ? 1 : undefined}
              choices={priceChoices}
              isOpen={expandedSection === 'price'}
              label={t('product.price')}
              onSelect={(choiceId) => {
                const bucket = priceBuckets.find((item) => item.id === choiceId)
                onSetDraftPrice(bucket?.min, bucket?.max)
              }}
              onToggle={() => onToggleSection('price')}
            />
          ) : null}

          {availabilityFilter && (
            <ProductListingChoiceFilterSectionView
              activeCount={draft.availability ? 1 : undefined}
              choices={getProductListingAvailabilityFilterChoiceDisplays({
                allLabel: t('product.anyAvailability'),
                filter: availabilityFilter,
                labels: {
                  inStock: t('product.inStock'),
                  outOfStock: t('product.outOfStock'),
                },
                selectedAvailability: draft.availability,
              })}
              isOpen={expandedSection === 'availability'}
              label={t('product.availability')}
              onSelect={(choiceId) =>
                onSetDraftAvailability(
                  availabilityFilter.options.find(
                    (option) => option.id === choiceId,
                  )?.id,
                )
              }
              onToggle={() => onToggleSection('availability')}
            />
          )}
        </>
      }
      showResultsLabel={t('product.showResults')}
      title={t('product.filterAndSort')}
    />
  )
}
