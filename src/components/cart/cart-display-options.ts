import type { CartLineItem } from '@/lib/cart/model/cart'

export type CartDisplayOptionValue = {
  id: string
  label: string
  optionTypeLabel: string
  optionTypeName: string
  position: number
  colorCode: string | null
}

function mapFallbackOptionText(
  optionText: string,
  index: number,
): CartDisplayOptionValue | null {
  const trimmedOption = optionText.trim()

  if (!trimmedOption) {
    return null
  }

  const [rawOptionType, ...rawLabelParts] = trimmedOption.split(':')
  const hasOptionType = rawLabelParts.length > 0
  const label = (hasOptionType ? rawLabelParts.join(':') : rawOptionType).trim()
  const optionTypeLabel = hasOptionType ? rawOptionType.trim() : ''

  if (!label) {
    return null
  }

  return {
    id: `fallback-${index}-${optionTypeLabel}-${label}`,
    label,
    optionTypeLabel,
    optionTypeName: optionTypeLabel,
    position: index,
    colorCode: null,
  }
}

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
        colorCode: optionValue.colorCode,
      }))
  }

  return item.optionsText
    .split(',')
    .map(mapFallbackOptionText)
    .filter((option): option is CartDisplayOptionValue => option !== null)
}
