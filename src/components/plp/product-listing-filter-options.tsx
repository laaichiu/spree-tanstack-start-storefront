import { CheckboxIndicator } from '@/components/plp/product-listing-filter-ui'
import { formatOptionLabel } from '@/components/plp/product-listing-filter-utils'
import type {
  ProductListingOptionFilter,
  ProductListingSearch,
} from '@/lib/catalog/model/product-listing'
import { cn } from '@/lib/utils'

export function ProductListingFilterOptions({
  draft,
  filter,
  onToggleDraftOption,
}: {
  draft: ProductListingSearch
  filter: ProductListingOptionFilter
  onToggleDraftOption: (optionId: string) => void
}) {
  if (filter.kind === 'color_swatch') {
    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-6">
        {filter.options.map((option) => {
          const isSelected = draft.option.includes(option.id)

          return (
            <button
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-2 text-center focus-visible:focus-ring"
              key={option.id}
              onClick={() => onToggleDraftOption(option.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border transition-all',
                  isSelected
                    ? 'border-foreground ring-2 ring-border'
                    : 'border-input',
                )}
                style={
                  option.imageUrl
                    ? {
                        backgroundImage: `url(${option.imageUrl})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }
                    : option.colorCode
                      ? { backgroundColor: option.colorCode }
                      : { backgroundColor: '#e5e5e5' }
                }
              />
              <span className="text-sm tracking-wider text-foreground uppercase">
                {formatOptionLabel(option)}
              </span>
              <span className="text-sm tracking-wider text-muted-foreground uppercase">
                {option.count}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filter.options.map((option) => {
        const isSelected = draft.option.includes(option.id)

        return (
          <button
            aria-pressed={isSelected}
            className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
            key={option.id}
            onClick={() => onToggleDraftOption(option.id)}
            type="button"
          >
            <CheckboxIndicator selected={isSelected} />
            <span className="flex-1">{formatOptionLabel(option)}</span>
            <span className="text-sm text-muted-foreground">
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
