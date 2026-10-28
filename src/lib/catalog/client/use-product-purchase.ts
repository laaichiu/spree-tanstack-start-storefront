import { useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'
import {
  getDefaultSelectedOptions,
  getProductPurchaseState,
} from '@/lib/catalog/contracts'
import type {
  Product,
  ProductPurchaseAvailability,
  ProductVariant,
  SelectedProductOptions,
} from '@/lib/catalog/contracts'
import type { Money } from '@/lib/core/money'

import { useAddToCart } from '../../cart/client/use-cart-mutations'

export type { ProductPurchaseAvailability } from '@/lib/catalog/contracts'

export type ProductPurchaseController = {
  activeCompareAtPrice?: Money | null
  activeDiscountPercent: number | null
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
  { market }: { market: MarketSelectionInput },
): ProductPurchaseController {
  const addToCartMutation = useAddToCart({ market })
  const purchaseContextKey = `${product.id}:${market.country}:${market.locale}`
  const purchaseContextGenerationRef = useRef(0)
  const previousPurchaseContextKeyRef = useRef(purchaseContextKey)

  if (previousPurchaseContextKeyRef.current !== purchaseContextKey) {
    previousPurchaseContextKeyRef.current = purchaseContextKey
    purchaseContextGenerationRef.current += 1
  }

  const purchaseContextOwner = `${purchaseContextGenerationRef.current}:${purchaseContextKey}`
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const [selectedOptions, setSelectedOptions] =
    useState<SelectedProductOptions>(() => getDefaultSelectedOptions(product))

  useEffect(() => {
    setSelectedOptions((currentOptions) => {
      const validOptions = Object.fromEntries(
        Object.entries(currentOptions).filter(([optionId, valueId]) =>
          product.options.some(
            (option) =>
              option.id === optionId &&
              option.values.some((value) => value.id === valueId),
          ),
        ),
      )

      if (
        Object.keys(validOptions).length === Object.keys(currentOptions).length
      ) {
        return currentOptions
      }

      return {
        ...getDefaultSelectedOptions(product),
        ...validOptions,
      }
    })
  }, [product])

  const purchaseState = getProductPurchaseState(product, selectedOptions)
  const addToCartContextKey = JSON.stringify([
    purchaseContextOwner,
    purchaseState.addableVariantId,
    purchaseState.activePrice?.amount ?? null,
    purchaseState.activePrice?.currencyCode ?? null,
    purchaseState.availability,
  ])
  const addToCartContextGenerationRef = useRef(0)
  const previousAddToCartContextKeyRef = useRef(addToCartContextKey)

  if (previousAddToCartContextKeyRef.current !== addToCartContextKey) {
    previousAddToCartContextKeyRef.current = addToCartContextKey
    addToCartContextGenerationRef.current += 1
  }

  const addToCartOwner = `${addToCartContextGenerationRef.current}:${addToCartContextKey}`
  const currentAddToCartOwnerRef = useRef(addToCartOwner)
  currentAddToCartOwnerRef.current = addToCartOwner
  const addToCartInFlightRef = useRef<string | null>(null)
  const [addToCartState, setAddToCartState] = useState<{
    owner: string | null
    status: 'idle' | 'pending' | 'error'
  }>({ owner: null, status: 'idle' })

  useEffect(() => {
    addToCartInFlightRef.current = null
    setAddToCartState({ owner: null, status: 'idle' })
  }, [addToCartOwner])

  function selectOption(optionId: string, valueId: string) {
    setSelectedOptions((currentOptions) => ({
      ...currentOptions,
      [optionId]: valueId,
    }))
  }

  async function addSelectedVariantToCart() {
    if (
      !purchaseState.addableVariantId ||
      addToCartInFlightRef.current === addToCartOwner ||
      (addToCartState.owner === addToCartOwner &&
        addToCartState.status === 'pending')
    ) {
      return
    }

    const requestOwner = addToCartOwner
    addToCartInFlightRef.current = requestOwner
    setAddToCartState({ owner: requestOwner, status: 'pending' })

    try {
      await addToCartMutation.mutateAsync({
        quantity: 1,
        variantId: purchaseState.addableVariantId,
      })

      if (
        isMountedRef.current &&
        currentAddToCartOwnerRef.current === requestOwner
      ) {
        setAddToCartState({ owner: requestOwner, status: 'idle' })
        window.dispatchEvent(new CustomEvent('spree-storefront:open-cart'))
      }
    } catch {
      // Keep the failure visible only while this product/market owns the view.
      if (
        isMountedRef.current &&
        currentAddToCartOwnerRef.current === requestOwner
      ) {
        setAddToCartState({ owner: requestOwner, status: 'error' })
      }
    } finally {
      if (
        isMountedRef.current &&
        currentAddToCartOwnerRef.current === requestOwner &&
        addToCartInFlightRef.current === requestOwner
      ) {
        addToCartInFlightRef.current = null
      }
    }
  }

  return {
    activeCompareAtPrice: purchaseState.activeCompareAtPrice,
    activeDiscountPercent: purchaseState.activeDiscountPercent,
    activePrice: purchaseState.activePrice,
    activeSku: purchaseState.activeSku,
    addSelectedVariantToCart,
    availability: purchaseState.availability,
    canAddToCart: purchaseState.canAddToCart,
    hasAddToCartError:
      addToCartState.owner === addToCartOwner &&
      addToCartState.status === 'error',
    isAddingToCart:
      addToCartState.owner === addToCartOwner &&
      addToCartState.status === 'pending',
    isPreorder: purchaseState.isPreorder,
    selectedOptions,
    selectedVariant: purchaseState.selectedVariant,
    selectOption,
  }
}
