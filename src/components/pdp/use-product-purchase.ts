import { useMemo, useState } from 'react'

import { useAddToCart } from '@/components/cart/use-cart'
import type { Product, ProductVariant } from '@/lib/catalog/model/product'
import {
  getDefaultSelectedOptions,
  isCatalogItemPurchasable,
  resolveSelectedVariant,
} from '@/lib/catalog/utils/variant-selection'
import type { SelectedProductOptions } from '@/lib/catalog/utils/variant-selection'
import type { Money } from '@/lib/money/money'

export type ProductPurchaseAvailability =
  | 'ready'
  | 'select_variant'
  | 'unavailable'

export type ProductPurchaseController = {
  activeCompareAtPrice?: Money | null
  activePrice: Money | null
  activeSku: string | null
  addSelectedVariantToCart: () => Promise<void>
  availability: ProductPurchaseAvailability
  canAddToCart: boolean
  hasAddToCartError: boolean
  isAddingToCart: boolean
  isPreorder: boolean
  selectedOptions: SelectedProductOptions
  selectedVariant: ProductVariant | null
  selectOption: (optionId: string, valueId: string) => void
}

export function useProductPurchase(
  product: Product,
): ProductPurchaseController {
  const addToCartMutation = useAddToCart()
  const [selectedOptions, setSelectedOptions] =
    useState<SelectedProductOptions>(() => getDefaultSelectedOptions(product))
  const selectedVariant = useMemo(
    () => resolveSelectedVariant(product, selectedOptions),
    [product, selectedOptions],
  )
  const activePrice = selectedVariant?.price ?? product.price
  const activeCompareAtPrice =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice
  const activeSku =
    selectedVariant?.sku ??
    product.variants.find((variant) => variant.id === product.defaultVariantId)
      ?.sku ??
    product.variants[0]?.sku ??
    null
  const isPreorder = selectedVariant?.preorder ?? product.preorder
  const selectedVariantPurchasable = selectedVariant
    ? isCatalogItemPurchasable(selectedVariant)
    : false
  const addableVariantId =
    selectedVariant && selectedVariantPurchasable
      ? selectedVariant.id
      : product.purchasable && product.variantCount === 1
        ? product.defaultVariantId
        : null
  const canAddToCart = Boolean(addableVariantId)
  const availability: ProductPurchaseAvailability = canAddToCart
    ? 'ready'
    : selectedVariant === null && product.options.length > 0
      ? 'select_variant'
      : 'unavailable'

  function selectOption(optionId: string, valueId: string) {
    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      [optionId]: valueId,
    }))
  }

  async function addSelectedVariantToCart() {
    if (!addableVariantId) {
      return
    }

    try {
      await addToCartMutation.mutateAsync({
        quantity: 1,
        variantId: addableVariantId,
      })

      window.dispatchEvent(new CustomEvent('spree-storefront:open-cart'))
    } catch {
      // The mutation exposes its mapped error state to the page view.
    }
  }

  return {
    activeCompareAtPrice,
    activePrice,
    activeSku,
    addSelectedVariantToCart,
    availability,
    canAddToCart,
    hasAddToCartError: Boolean(addToCartMutation.error),
    isAddingToCart: addToCartMutation.isPending,
    isPreorder,
    selectedOptions,
    selectedVariant,
    selectOption,
  }
}
