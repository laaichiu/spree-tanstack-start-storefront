import type { ProductVariant, ProductVariantOptionValue } from './product'
import { isColorOption } from './option-display'
import { isCatalogItemPurchasable } from './variant-selection'

export type ProductColorVariant = {
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

type VariantPriority = readonly [
  commerceValid: number,
  isDefault: number,
  matchesDefaultCombination: number,
  hasImage: number,
]

function getVariantPriority(
  variant: ProductVariant,
  defaultVariantId: string | null,
  defaultOptionValues: Map<string, string>,
): VariantPriority {
  const matchesDefaultCombination = Array.from(defaultOptionValues).every(
    ([optionTypeId, optionValueId]) =>
      variant.optionValues.some(
        (optionValue) =>
          optionValue.optionTypeId === optionTypeId &&
          optionValue.id === optionValueId,
      ),
  )

  return [
    variant.price !== null && isCatalogItemPurchasable(variant) ? 1 : 0,
    variant.id === defaultVariantId ? 1 : 0,
    matchesDefaultCombination ? 1 : 0,
    variant.image ? 1 : 0,
  ]
}

function compareVariantPriority(
  candidate: VariantPriority,
  current: VariantPriority,
) {
  for (let index = 0; index < candidate.length; index += 1) {
    if (candidate[index] !== current[index]) {
      return candidate[index] - current[index]
    }
  }

  return 0
}

export function getProductColorVariants(
  variants: ProductVariant[],
  defaultVariantId: string | null,
): ProductColorVariant[] {
  const colorVariants = new Map<string, ProductColorVariant>()
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

    if (!current) {
      colorVariants.set(optionValue.id, { optionValue, variant })
      continue
    }

    const candidatePriority = getVariantPriority(
      variant,
      defaultVariantId,
      defaultOptionValues,
    )
    const currentPriority = getVariantPriority(
      current.variant,
      defaultVariantId,
      defaultOptionValues,
    )

    if (compareVariantPriority(candidatePriority, currentPriority) > 0) {
      colorVariants.set(optionValue.id, { optionValue, variant })
    }
  }

  return Array.from(colorVariants.values())
}
