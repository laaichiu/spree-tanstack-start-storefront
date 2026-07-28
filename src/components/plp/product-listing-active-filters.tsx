import { X } from 'lucide-react'

import type { PriceBucket } from '@/components/plp/product-listing-filter-utils'
import { getAvailabilityLabel } from '@/components/plp/product-listing-filter-utils'
import type { ProductListingSearch } from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'

type ActiveOptionMeta = {
  filterLabel: string
  label: string
}

type ProductListingActiveFiltersProps = {
  activeOptionMetaById: Map<string, ActiveOptionMeta>
  appliedPriceBucket?: PriceBucket
  onClearAll: () => void
  onRemoveAvailability: () => void
  onRemoveOption: (optionId: string) => void
  onRemovePrice: () => void
  search: ProductListingSearch
  t: (key: MessageKey) => string
}

export function ProductListingActiveFilters({
  activeOptionMetaById,
  appliedPriceBucket,
  onClearAll,
  onRemoveAvailability,
  onRemoveOption,
  onRemovePrice,
  search,
  t,
}: ProductListingActiveFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {search.option.map((optionId) => {
        const meta = activeOptionMetaById.get(optionId)
        const chipLabel = meta ? `${meta.filterLabel}: ${meta.label}` : optionId

        return (
          <ActiveFilterChip
            key={optionId}
            label={chipLabel}
            onRemove={() => onRemoveOption(optionId)}
          />
        )
      })}

      {search.availability ? (
        <ActiveFilterChip
          label={`${t('product.availability')}: ${getAvailabilityLabel(
            search.availability,
            {
              inStock: t('product.inStock'),
              outOfStock: t('product.outOfStock'),
            },
          )}`}
          onRemove={onRemoveAvailability}
        />
      ) : null}

      {appliedPriceBucket ? (
        <ActiveFilterChip
          label={appliedPriceBucket.label}
          onRemove={onRemovePrice}
        />
      ) : null}

      <button
        className="text-sm font-normal tracking-wider text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:focus-ring"
        onClick={onClearAll}
        type="button"
      >
        {t('product.clearAll')}
      </button>
    </div>
  )
}

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <button
      className="inline-flex items-center gap-2 border border-input px-3 py-1 text-sm tracking-wider text-muted-foreground uppercase transition-colors hover:border-foreground hover:text-foreground focus-visible:focus-ring"
      onClick={onRemove}
      type="button"
    >
      <span>{label}</span>
      <X aria-hidden="true" className="h-3 w-3" />
    </button>
  )
}
