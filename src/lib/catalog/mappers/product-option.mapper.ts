import type {
  OptionValue as SpreeOptionValue,
  Product as SpreeProduct,
  Variant as SpreeVariant,
} from '@spree/sdk'

import {
  mapSpreeCompareAtPriceToMoney,
  mapSpreePriceToMoney,
} from '@/lib/money/map-spree-price'

import type {
  ProductOption,
  ProductOptionValue,
  ProductImage,
  ProductVariant,
  ProductVariantOptionValue,
} from '../model/product'
import { mapSpreeMediaSrcSet } from './product-media.mapper'

function mapVariantImage(variant: SpreeVariant): ProductImage | null {
  const media = variant.primary_media ?? variant.media?.[0]
  const src =
    media?.large_url ??
    media?.medium_url ??
    media?.small_url ??
    media?.original_url ??
    variant.thumbnail_url

  if (!src) {
    return null
  }

  return {
    id: media?.id ?? `${variant.id}:thumbnail`,
    src,
    ...(media ? { srcSet: mapSpreeMediaSrcSet(media) } : {}),
    alt:
      media?.alt ?? (variant.options_text || variant.sku || 'Product variant'),
    variantIds: media?.variant_ids.length ? media.variant_ids : [variant.id],
  }
}

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

export function mapSpreeVariantToProductVariant(
  variant: SpreeVariant,
): ProductVariant {
  const image = mapVariantImage(variant)

  return {
    id: variant.id,
    sku: variant.sku,
    price: mapSpreePriceToMoney(variant.price),
    compareAtPrice: mapSpreeCompareAtPriceToMoney(
      variant.price,
      variant.original_price,
    ),
    ...(image ? { image } : {}),
    inStock: variant.in_stock,
    backorderable: variant.backorderable,
    purchasable: variant.purchasable,
    preorder: variant.preorder,
    preorderShipsAt: variant.preorder_ships_at,
    optionValues: variant.option_values.map(mapOptionValue),
  }
}

export function mapProductVariants(
  variants: SpreeVariant[] | null | undefined,
): ProductVariant[] {
  return (variants ?? []).map(mapSpreeVariantToProductVariant)
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
