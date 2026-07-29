import type {
  OptionValue as SpreeOptionValue,
  Product as SpreeProduct,
  Variant as SpreeVariant,
} from '@spree/sdk'

import { mapSpreePriceToMoney } from '@/lib/money/map-spree-price'

import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionValue,
} from '../model/product'

function mapOptionValue(
  optionValue: SpreeOptionValue,
): ProductVariantOptionValue {
  return {
    id: optionValue.id,
    name: optionValue.name,
    label: optionValue.label,
    colorCode: optionValue.color_code,
    imageUrl: optionValue.image_url,
    optionTypeId: optionValue.option_type_id,
    optionTypeName: optionValue.option_type_name,
    optionTypeLabel: optionValue.option_type_label,
  }
}

function mapOptionValueForProduct(
  optionValue: ProductVariantOptionValue,
): ProductOptionValue {
  return {
    id: optionValue.id,
    name: optionValue.name,
    label: optionValue.label,
    colorCode: optionValue.colorCode,
    imageUrl: optionValue.imageUrl,
  }
}

function mapVariant(variant: SpreeVariant): ProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    price: mapSpreePriceToMoney(variant.price),
    compareAtPrice: variant.original_price
      ? mapSpreePriceToMoney(variant.original_price)
      : undefined,
    inStock: variant.purchasable && (variant.in_stock || variant.preorder),
    preorder: variant.preorder,
    preorderShipsAt: variant.preorder_ships_at,
    optionValues: variant.option_values.map(mapOptionValue),
  }
}

export function mapProductVariants(
  variants: SpreeVariant[] | null | undefined,
): ProductVariant[] {
  return (variants ?? []).map(mapVariant)
}

export function mapProductOptions(
  product: SpreeProduct,
  variants: ProductVariant[],
): ProductOption[] {
  const optionMap = new Map<string, ProductOption>()
  const optionValues = [
    ...(product.option_values ?? []).map(mapOptionValue),
    ...variants.flatMap((variant) => variant.optionValues),
  ]

  for (const optionValue of optionValues) {
    const option = optionMap.get(optionValue.optionTypeId) ?? {
      id: optionValue.optionTypeId,
      name: optionValue.optionTypeName,
      label: optionValue.optionTypeLabel,
      values: [],
    }

    if (!option.values.some((value) => value.id === optionValue.id)) {
      option.values.push(mapOptionValueForProduct(optionValue))
    }

    optionMap.set(option.id, option)
  }

  return Array.from(optionMap.values())
}
