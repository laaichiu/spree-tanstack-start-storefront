import type {
  CartFreeShippingPromotion,
  CartDrawerModel,
  CartSummary,
} from '@/lib/cart/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import { getCartDrawerModel } from '@/lib/cart/contracts'

import { hasCartLoadError } from './cart-load-error'
import { useCartItemMutations } from './use-cart-item-mutations'
import { useCart } from './use-cart-query'

export type CartDrawerState = {
  cartMutationError: string | null
  isCartMutationPending: boolean
  isResetPending: boolean
  model: CartDrawerModel
  onRecoverCartSession: () => Promise<void>
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
}

export function useCartDrawerState({
  errorMessage,
  freeShippingPromotion,
  initialCart,
  initialCartLoadError,
  market,
}: {
  errorMessage: string
  freeShippingPromotion: CartFreeShippingPromotion | null
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
  market: MarketSelectionInput
}): CartDrawerState {
  const {
    data: cart,
    error,
    isFetched,
    isLoading,
  } = useCart({
    initialCart,
    market,
  })
  const {
    cartMutationError,
    isCartMutationPending,
    isResetPending,
    recoverCartSession,
    removeItem,
    updateQuantity,
  } = useCartItemMutations({
    cartId: cart?.id,
    errorMessage,
    market,
  })

  return {
    cartMutationError,
    isCartMutationPending,
    isResetPending,
    model: getCartDrawerModel({
      cart,
      freeShippingPromotion,
      hasLoadError: hasCartLoadError({
        error,
        initialCartLoadError,
        isFetched,
      }),
      isLoading,
    }),
    onRecoverCartSession: recoverCartSession,
    onRemoveItem: removeItem,
    onUpdateQuantity: updateQuantity,
  }
}
