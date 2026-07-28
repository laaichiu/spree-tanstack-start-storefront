import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/model/cart'

import { useCartItemMutations } from './use-cart-item-mutations'
import { useCart } from './use-cart'

type CartPageItemActions = {
  error: string | null
  pendingLineItemId: string | null
  removeItem: (lineItemId: string) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
}

export type CartPageControllerValue =
  | { status: 'loading' }
  | {
      status: 'error'
      recovery: {
        error: string | null
        isPending: boolean
        recover: () => Promise<void>
      }
    }
  | { status: 'empty' }
  | {
      status: 'ready'
      cart: CartSummary
      itemActions: CartPageItemActions
    }

type CartPageControllerProps = {
  children: (controller: CartPageControllerValue) => ReactNode
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
}

export function CartPageController({
  children,
  initialCart,
  initialCartLoadError = null,
}: CartPageControllerProps) {
  const { t } = useMarket()
  const { data: cart, error, isFetched, isLoading } = useCart({ initialCart })
  const {
    cartMutationError,
    isResetPending,
    pendingLineItemId,
    recoverCartSession,
    removeItem,
    updateQuantity,
  } = useCartItemMutations({ errorMessage: t('cart.cartMutationFailed') })
  const cartLoadError = error ?? (!isFetched ? initialCartLoadError : null)

  if (isLoading && !initialCartLoadError) {
    return children({ status: 'loading' })
  }

  if (cartLoadError) {
    return children({
      recovery: {
        error: cartMutationError,
        isPending: isResetPending,
        recover: recoverCartSession,
      },
      status: 'error',
    })
  }

  if (!cart || cart.items.length === 0) {
    return children({ status: 'empty' })
  }

  return children({
    cart,
    itemActions: {
      error: cartMutationError,
      pendingLineItemId,
      removeItem,
      updateQuantity,
    },
    status: 'ready',
  })
}
