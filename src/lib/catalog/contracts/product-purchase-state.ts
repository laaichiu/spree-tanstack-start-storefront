import { getDiscountPercent } from '@/lib/core/money'
import type { Money } from '@/lib/core/money'
import {
  getDefaultSelectedOptions,
  isCatalogItemPurchasable,
  resolveSelectedVariant,
} from './variant-selection'
import type { SelectedProductOptions } from './variant-selection'
import type { Product, ProductVariant } from './product'

export type ProductPurchaseAvailability =
  'ready' | 'select_variant' | 'unavailable'

export type ProductPurchaseState = {
  activeCompareAtPrice?: Money | null
  activeDiscountPercent: number | null
  activePrice: Money | null
  activeSku: string | null
  addableVariantId: string | null
  availability: ProductPurchaseAvailability
  canAddToCart: boolean
  isPreorder: boolean
  selectedVariant: ProductVariant | null
}

export type ProductPurchaseActionModel = Pick<
  ProductPurchaseState,
  'availability' | 'canAddToCart' | 'isPreorder'
> & {
  hasAddToCartError: boolean
  isAddingToCart: boolean
}

export function getProductPurchaseState(
  product: Product,
  selectedOptions: SelectedProductOptions = getDefaultSelectedOptions(product),
): ProductPurchaseState {
  const selectedVariant = resolveSelectedVariant(product, selectedOptions)
  const activePrice = selectedVariant ? selectedVariant.price : product.price
  const activeCompareAtPrice = selectedVariant
    ? (selectedVariant.compareAtPrice ?? null)
    : (product.compareAtPrice ?? null)
  const activeSku =
    selectedVariant?.sku ??
    product.variants.find((variant) => variant.id === product.defaultVariantId)
      ?.sku ??
    product.variants[0]?.sku ??
    null
  const isPreorder = selectedVariant?.preorder ?? product.preorder
  const selectedVariantPurchasable = selectedVariant
    ? activePrice !== null && isCatalogItemPurchasable(selectedVariant)
    : false
  const addableVariantId =
    selectedVariant && selectedVariantPurchasable
      ? selectedVariant.id
      : selectedVariant === null &&
          activePrice !== null &&
          product.purchasable &&
          product.variantCount === 1
        ? product.variants.length === 0
          ? product.defaultVariantId
          : null
        : null
  const canAddToCart = Boolean(addableVariantId)
  const availability: ProductPurchaseAvailability = canAddToCart
    ? 'ready'
    : selectedVariant === null && product.options.length > 0
      ? 'select_variant'
      : 'unavailable'

  return {
    activeCompareAtPrice,
    activeDiscountPercent: getDiscountPercent(
      activePrice,
      activeCompareAtPrice,
    ),
    activePrice,
    activeSku,
    addableVariantId,
    availability,
    canAddToCart,
    isPreorder,
    selectedVariant,
  }
}
