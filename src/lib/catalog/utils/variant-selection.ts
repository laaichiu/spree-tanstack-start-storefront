import type { Product, ProductVariant } from '../model/product'

export type SelectedProductOptions = Record<string, string>

type PurchasableCatalogItem = {
  backorderable?: boolean
  inStock: boolean
  preorder?: boolean
  purchasable?: boolean
}

export function isCatalogItemPurchasable(
  item: PurchasableCatalogItem,
): boolean {
  return (
    item.purchasable ??
    (item.inStock || item.backorderable === true || item.preorder === true)
  )
}

function variantMatchesSelection(
  variant: ProductVariant,
  selectedOptions: SelectedProductOptions,
) {
  return Object.entries(selectedOptions).every(([optionId, valueId]) =>
    variant.optionValues.some(
      (value) => value.optionTypeId === optionId && value.id === valueId,
    ),
  )
}

export function getDefaultSelectedOptions(
  product: Product,
): SelectedProductOptions {
  const defaultVariant =
    product.variants.find(isCatalogItemPurchasable) ?? product.variants.at(0)

  if (!defaultVariant) {
    return {}
  }

  return Object.fromEntries(
    defaultVariant.optionValues.map((value) => [value.optionTypeId, value.id]),
  )
}

export function resolveSelectedVariant(
  product: Product,
  selectedOptions: SelectedProductOptions,
) {
  return (
    product.variants.find((variant) =>
      variantMatchesSelection(variant, selectedOptions),
    ) ?? null
  )
}

export function isOptionValueSelectable({
  optionId,
  product,
  selectedOptions,
  valueId,
}: {
  optionId: string
  product: Product
  selectedOptions: SelectedProductOptions
  valueId: string
}) {
  const nextSelection = {
    ...selectedOptions,
    [optionId]: valueId,
  }

  return product.variants.some(
    (variant) =>
      isCatalogItemPurchasable(variant) &&
      variantMatchesSelection(variant, nextSelection),
  )
}
