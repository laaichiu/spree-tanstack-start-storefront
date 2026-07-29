import type {
  ProductVariant,
  ProductVariantOptionValue,
} from '@/lib/catalog/model/product'
import {
  getOptionSwatchClass,
  isColorOption,
} from '@/lib/catalog/option-swatch'
import { isCatalogItemPurchasable } from '@/lib/catalog/utils/variant-selection'
import { cn } from '@/lib/utils'

export type ProductCardColorVariant = {
  optionValue: ProductVariantOptionValue
  variant: ProductVariant
}

function getColorOptionValue(
  variant: ProductVariant,
): ProductVariantOptionValue | null {
  return (
    variant.optionValues.find((optionValue) =>
      isColorOption(
        `${optionValue.optionTypeLabel} ${optionValue.optionTypeName}`,
      ),
    ) ?? null
  )
}

function getVariantPriority(
  variant: ProductVariant,
  defaultVariantId: string | null,
  defaultOptionValues: Map<string, string>,
) {
  const matchesDefaultCombination = Array.from(defaultOptionValues).every(
    ([optionTypeId, optionValueId]) =>
      variant.optionValues.some(
        (optionValue) =>
          optionValue.optionTypeId === optionTypeId &&
          optionValue.id === optionValueId,
      ),
  )

  return (
    (variant.id === defaultVariantId ? 8 : 0) +
    (matchesDefaultCombination ? 4 : 0) +
    (variant.image ? 2 : 0) +
    (isCatalogItemPurchasable(variant) ? 1 : 0)
  )
}

export function getProductColorVariants(
  variants: ProductVariant[],
  defaultVariantId: string | null,
): ProductCardColorVariant[] {
  const colorVariants = new Map<string, ProductCardColorVariant>()
  const defaultVariant = variants.find(
    (variant) => variant.id === defaultVariantId,
  )
  const defaultOptionValues = new Map(
    (defaultVariant?.optionValues ?? [])
      .filter(
        (optionValue) =>
          !isColorOption(
            `${optionValue.optionTypeLabel} ${optionValue.optionTypeName}`,
          ),
      )
      .map((optionValue) => [optionValue.optionTypeId, optionValue.id]),
  )

  for (const variant of variants) {
    const optionValue = getColorOptionValue(variant)

    if (!optionValue) {
      continue
    }

    const current = colorVariants.get(optionValue.id)

    if (
      !current ||
      getVariantPriority(variant, defaultVariantId, defaultOptionValues) >
        getVariantPriority(
          current.variant,
          defaultVariantId,
          defaultOptionValues,
        )
    ) {
      colorVariants.set(optionValue.id, { optionValue, variant })
    }
  }

  return Array.from(colorVariants.values())
}

type ProductCardVariantSwatchesProps = {
  colorVariants: ProductCardColorVariant[]
  activeVariantId: string | null
  onVariantChange: (variantId: string) => void
}

export function ProductCardVariantSwatches({
  activeVariantId,
  colorVariants,
  onVariantChange,
}: ProductCardVariantSwatchesProps) {
  if (colorVariants.length === 0) {
    return null
  }

  return (
    <div
      aria-label="Product colors"
      className="flex flex-wrap items-center gap-2 px-1 pt-2"
    >
      {colorVariants.map(({ optionValue, variant }) => {
        const isActive = activeVariantId === variant.id

        return (
          <button
            aria-label={optionValue.label}
            aria-pressed={isActive}
            className={cn(
              'h-3.5 w-3.5 rounded-full border border-input transition focus-visible:focus-ring',
              isActive ? 'ring-1 ring-foreground ring-offset-1' : null,
            )}
            key={optionValue.id}
            onClick={() => onVariantChange(variant.id)}
            onFocus={(event) => {
              if (event.currentTarget.matches(':focus-visible')) {
                onVariantChange(variant.id)
              }
            }}
            onMouseEnter={() => onVariantChange(variant.id)}
            title={optionValue.label}
            style={
              optionValue.imageUrl
                ? {
                    backgroundImage: `url("${optionValue.imageUrl}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }
                : optionValue.colorCode
                  ? { backgroundColor: optionValue.colorCode }
                  : undefined
            }
            type="button"
          >
            {!optionValue.imageUrl && !optionValue.colorCode ? (
              <span
                aria-hidden="true"
                className={cn(
                  'block h-full w-full rounded-full',
                  getOptionSwatchClass(optionValue.label),
                )}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
