import type { CSSProperties } from 'react'

import { CheckboxIndicatorView } from './product-listing-filter-ui-view'
import type { ProductListingFilterDisplay } from './product-listing-option-filter-display'

export function ProductListingFilterOptionsView({
  filter,
  onToggle,
  selectedOptionIds,
}: {
  filter: ProductListingFilterDisplay
  onToggle: (optionId: string) => void
  selectedOptionIds: readonly string[]
}) {
  const isColorSwatch = filter.kind === 'color_swatch'

  if (isColorSwatch) {
    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-6">
        {filter.options.map((option) => {
          const selected = selectedOptionIds.includes(option.id)

          return (
            <button
              aria-pressed={selected}
              className="flex flex-col items-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              key={option.id}
              onClick={() => onToggle(option.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={
                  selected
                    ? 'flex h-8 w-8 items-center justify-center rounded-full border border-foreground ring-2 ring-border transition-all motion-reduce:transition-none'
                    : 'flex h-8 w-8 items-center justify-center rounded-full border border-input transition-all motion-reduce:transition-none'
                }
                style={getSwatchStyle(option.colorCode, option.imageUrl)}
              />
              <span className="text-xs tracking-wider text-foreground uppercase">
                {option.label}
              </span>
              <span className="text-xs tracking-wider text-muted-foreground uppercase">
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
        const selected = selectedOptionIds.includes(option.id)

        return (
          <button
            aria-pressed={selected}
            className="flex w-full items-center gap-3 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={option.id}
            onClick={() => onToggle(option.id)}
            type="button"
          >
            <CheckboxIndicatorView selected={selected} />
            <span className="flex-1">{option.label}</span>
            <span className="text-xs text-muted-foreground">
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function getSwatchStyle(
  colorCode: string | null,
  imageUrl: string | null,
): CSSProperties {
  if (imageUrl) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }
  }

  return {
    backgroundColor: colorCode ?? '#e5e5e5',
  }
}
