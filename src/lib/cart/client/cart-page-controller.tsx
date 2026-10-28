import type { ReactNode } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'
import { getCartPageModel } from '@/lib/cart/contracts'
import type { CartPageModel, CartSummary } from '@/lib/cart/contracts'

import { hasCartLoadError } from './cart-load-error'
import { useCart } from './use-cart-query'
import { useCartItemMutations } from './use-cart-item-mutations'

export type CartPageItemActions = {
  error: string | null
  isCartMutationPending: boolean
  removeItem: (lineItemId: string) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
}

export type CartPageRecoveryCapability = {
  error: string | null
  isPending: boolean
  recover: () => Promise<void>
}

export type CartPageControllerValue =
  | Extract<CartPageModel, { status: 'loading' }>
  | (Extract<CartPageModel, { status: 'error' }> & {
      recovery: CartPageRecoveryCapability
    })
  | Extract<CartPageModel, { status: 'empty' }>
  | (Extract<CartPageModel, { status: 'ready' }> & {
      itemActions: CartPageItemActions
    })

type CartPageControllerProps = {
  children: (controller: CartPageControllerValue) => ReactNode
  errorMessage: string
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
  market: MarketSelectionInput
}

export function CartPageController({
  children,
  errorMessage,
  initialCart,
  initialCartLoadError = null,
  market,
}: CartPageControllerProps) {
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
  const hasLoadError = hasCartLoadError({
    error,
    initialCartLoadError,
    isFetched,
  })
  const page = getCartPageModel({
    cart,
    hasLoadError,
    isLoading,
  })

  if (page.status === 'error') {
    return children({
      ...page,
      recovery: {
        error: cartMutationError,
        isPending: isResetPending,
        recover: recoverCartSession,
      },
    })
  }

  if (page.status === 'loading') {
    return children(page)
  }

  if (page.status === 'empty') {
    return children(page)
  }

  return children({
    ...page,
    itemActions: {
      error: cartMutationError,
      isCartMutationPending,
      removeItem,
      updateQuantity,
    },
  })
}
