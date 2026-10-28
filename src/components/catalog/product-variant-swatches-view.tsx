import { cn } from '@/components/ui/utils'

import type { CatalogProductColorVariant } from '../contracts/catalog'

export type { CatalogProductColorVariant } from '../contracts/catalog'

export function ProductVariantSwatchesView({
  activeVariantId,
  colorVariants,
  onVariantChange,
}: {
  activeVariantId: string | null
  colorVariants: readonly CatalogProductColorVariant[]
  onVariantChange: (variantId: string) => void
}) {
  if (colorVariants.length === 0) {
    return null
  }

  return (
    <div
      aria-label="Product colors"
      className="mt-1 flex h-6 flex-nowrap items-center gap-0 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {colorVariants.map(({ optionValue, variant }) => {
        const isActive = activeVariantId === variant.id
        const selectVariant = () => onVariantChange(variant.id)

        return (
          <button
            aria-label={optionValue.label}
            aria-pressed={isActive}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={optionValue.id}
            onClick={selectVariant}
            onFocus={(event) => {
              if (!event.currentTarget.matches(':focus-visible')) {
                return
              }

              selectVariant()
            }}
            onMouseEnter={selectVariant}
            title={optionValue.label}
            type="button"
          >
            <span
              aria-hidden="true"
              className={cn(
                'block h-3 w-3 rounded-full border border-input bg-muted',
                isActive && 'ring-1 ring-foreground ring-offset-1',
              )}
              style={getVariantSwatchStyle(optionValue)}
            />
          </button>
        )
      })}
    </div>
  )
}

function getVariantSwatchStyle({
  colorCode,
  imageUrl,
}: CatalogProductColorVariant['optionValue']) {
  if (imageUrl) {
    return {
      backgroundImage: `url("${imageUrl}")`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }
  }

  if (colorCode) {
    return { backgroundColor: colorCode }
  }

  return undefined
}
