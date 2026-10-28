import { useEffect, useRef } from 'react'

import { cartLineItemsChanged } from '@/lib/cart/contracts'
import type { CartSummary } from '@/lib/cart/contracts'
import {
  getCheckoutEntryPageModel,
  isCheckoutOrder,
} from '@/lib/checkout/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { useCart } from '../../cart/client/use-cart-query'
import {
  getCheckoutOrderSnapshotQueryKey,
  useCheckoutOrder,
} from './use-checkout-order'
import { useResetCheckoutSession } from './use-checkout-session-reset'
import { getCheckoutLoadErrorMessage } from '../utils/checkout-load-error'

export type CheckoutEntryStateRuntimeOptions = {
  cartId?: string
  initialCart?: CartSummary | CheckoutOrder | null
  initialCartLoadError?: string | null
  cartLoadErrorFallback: string
  market: MarketSelectionInput
  navigateToCheckout: () => Promise<void>
}

export type CheckoutEntryStateRuntimeValue = {
  cartLoadErrorMessage: string
  isResetPending: boolean
  page: ReturnType<typeof getCheckoutEntryPageModel>
  recoverCheckoutSession: () => Promise<void>
}

export function useCheckoutEntryStateRuntime({
  cartId,
  initialCart,
  initialCartLoadError,
  cartLoadErrorFallback,
  market,
  navigateToCheckout,
}: CheckoutEntryStateRuntimeOptions): CheckoutEntryStateRuntimeValue {
  const cartQuery = useCart({
    enabled: !cartId,
    initialCart: cartId ? undefined : initialCart,
    market,
    refetchOnMount: !cartId && initialCart ? false : undefined,
    staleTime: !cartId && initialCart ? 30_000 : undefined,
  })
  const checkoutOrderQuery = useCheckoutOrder({
    cartId,
    enabled: Boolean(cartId),
    initialOrder: isCheckoutOrder(initialCart) ? initialCart : undefined,
    market,
    refetchOnMount: cartId && initialCart ? false : undefined,
    staleTime: cartId && initialCart ? 30_000 : undefined,
  })
  const checkoutCartSnapshotQuery = useCheckoutOrder({
    cartId,
    enabled: Boolean(cartId),
    market,
    refetchOnMount: 'always',
    retry: false,
    staleTime: 0,
    queryKey: cartId
      ? getCheckoutOrderSnapshotQueryKey({
          cartId,
          country: market.country,
          locale: market.locale,
        })
      : undefined,
  })
  const resetCheckoutSession = useResetCheckoutSession({ market })
  const activeQuery = cartId ? checkoutOrderQuery : cartQuery
  const cart = activeQuery.data
  const error = activeQuery.error
  const isFetched = activeQuery.isFetched
  const isLoading = activeQuery.isLoading
  const cartLoadErrorMessage = getCheckoutLoadErrorMessage({
    error,
    fallback: cartLoadErrorFallback,
    initialError: initialCartLoadError,
  })
  const checkoutCartSnapshot = checkoutCartSnapshotQuery.data
  const refetchCheckoutOrder = checkoutOrderQuery.refetch
  const recoveryGenerationRef = useRef(0)

  useEffect(() => {
    recoveryGenerationRef.current += 1

    return () => {
      recoveryGenerationRef.current += 1
    }
  }, [cartId, market.country, market.locale])

  useEffect(() => {
    if (
      !cartId ||
      !isCheckoutOrder(cart) ||
      !checkoutCartSnapshot ||
      checkoutCartSnapshot.id !== cart.id ||
      !cartLineItemsChanged(cart, checkoutCartSnapshot)
    ) {
      return
    }

    void refetchCheckoutOrder()
  }, [cart, cartId, checkoutCartSnapshot, refetchCheckoutOrder])

  function recoverCheckoutSession() {
    const recoveryGeneration = recoveryGenerationRef.current

    return resetCheckoutSession.mutateAsync().then(
      (result) => {
        if (result && recoveryGenerationRef.current === recoveryGeneration) {
          return navigateToCheckout().catch(() => undefined)
        }
      },
      () => {
        // The entry error surface already remains visible and its reset
        // action stays retryable after a failed session reset.
      },
    )
  }

  return {
    cartLoadErrorMessage,
    isResetPending: resetCheckoutSession.isPending,
    page: getCheckoutEntryPageModel({
      cart,
      hasLoadError: Boolean(
        error ?? (!isFetched || !cart ? initialCartLoadError : null),
      ),
      isLoading,
    }),
    recoverCheckoutSession,
  }
}
