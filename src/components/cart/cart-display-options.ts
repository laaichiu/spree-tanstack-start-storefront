import type { CartLineItem } from '@/lib/cart/contracts'

type CartDisplayOptionValue = {
  id: string
  label: string
  optionTypeLabel: string
  optionTypeName: string
  position: number
  colorCode?: string
}

function mapFallbackOptionText(
  optionText: string,
  index: number,
): CartDisplayOptionValue | undefined {
  const trimmedOption = optionText.trim()

  if (!trimmedOption) {
    return undefined
  }

  const [rawOptionType, ...rawLabelParts] = trimmedOption.split(':')
  const hasOptionType = rawLabelParts.length > 0
  const label = (hasOptionType ? rawLabelParts.join(':') : rawOptionType).trim()
  const optionTypeLabel = hasOptionType ? rawOptionType.trim() : ''

  if (!label) {
    return undefined
  }

  return {
    id: `fallback-${index}-${optionTypeLabel}-${label}`,
    label,
    optionTypeLabel,
    optionTypeName: optionTypeLabel,
    position: index,
  }
}

/**
 * Projects a normalized cart line item into options rendered by this theme.
 *
 * Legacy options text is kept as a storefront display fallback while the
 * normalized option values remain the runtime/core source of truth.
 */
export function getCartDisplayOptions(
  item: CartLineItem,
): CartDisplayOptionValue[] {
  if (item.optionValues.length > 0) {
    return [...item.optionValues]
      .sort((first, second) => first.position - second.position)
      .map((optionValue) => ({
        id: optionValue.id,
        label: optionValue.label,
        optionTypeLabel: optionValue.optionTypeLabel,
        optionTypeName: optionValue.optionTypeName,
        position: optionValue.position,
        ...(optionValue.colorCode ? { colorCode: optionValue.colorCode } : {}),
      }))
  }

  return item.optionsText.split(',').flatMap((optionText, index) => {
    const option = mapFallbackOptionText(optionText, index)
    return option ? [option] : []
  })
}
