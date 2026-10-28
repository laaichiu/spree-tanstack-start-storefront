import { CloseIcon } from '@/components/ui/close-icon'
import type { ProductListingActiveFiltersActions } from '../contracts/catalog'

export type { ProductListingActiveFiltersActions } from '../contracts/catalog'

export type ProductListingActiveFilter = {
  id: string
  label: string
}

export function ProductListingActiveFiltersView({
  actions,
  availabilityChip,
  clearAllLabel,
  optionChips,
  priceChip,
}: {
  actions: ProductListingActiveFiltersActions
  availabilityChip: ProductListingActiveFilter | null
  clearAllLabel: string
  optionChips: ProductListingActiveFilter[]
  priceChip: ProductListingActiveFilter | null
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {optionChips.map((chip) => (
        <ActiveFilterChipView
          key={chip.id}
          label={chip.label}
          onRemove={() => actions.removeOption(chip.id)}
        />
      ))}
      {availabilityChip ? (
        <ActiveFilterChipView
          label={availabilityChip.label}
          onRemove={actions.removeAvailability}
        />
      ) : null}
      {priceChip ? (
        <ActiveFilterChipView
          label={priceChip.label}
          onRemove={actions.removePrice}
        />
      ) : null}
      <button
        className="text-xs font-normal tracking-wider text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={actions.clearAll}
        type="button"
      >
        {clearAllLabel}
      </button>
    </div>
  )
}

function ActiveFilterChipView({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <button
      className="rounded-full inline-flex items-center gap-2 border border-input px-3 py-1 text-xs text-muted-foreground transition-colors motion-reduce:transition-none enabled:hover:not-focus-visible:border-foreground/40 focus-visible:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onRemove}
      type="button"
    >
      <span>{label}</span>
      <CloseIcon className="size-2" />
    </button>
  )
}
