import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useCart, useResetCartSession } from '@/components/cart/use-cart'
import type { CartSummary } from '@/lib/cart/model/cart'
import { cartLineItemsChanged } from '@/lib/cart/utils/cart-items-fingerprint'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import { useCheckoutOrder } from '@/components/checkout/use-checkout-order'
import type {
  CheckoutCompletionErrorCode,
  CheckoutOrder,
} from '@/lib/checkout/model/checkout'
import { useMarket } from '@/components/layout/market-provider'
import { isCheckoutOrder } from '@/lib/checkout/utils/checkout-order'

import { CheckoutReadyStateController } from './checkout-ready-state-controller'
import { CheckoutReadyStateReferenceView } from './checkout-ready-state-reference-view'
import {
  CheckoutLoadErrorState,
  CheckoutLoadingState,
  CheckoutUnavailableState,
} from './checkout-entry-states'
import type { CheckoutReadyStateOptions } from './use-checkout-ready-state'

function CheckoutReadyState(props: CheckoutReadyStateOptions) {
  return (
    <CheckoutReadyStateController {...props}>
      {(controller) => (
        <CheckoutReadyStateReferenceView controller={controller} />
      )}
    </CheckoutReadyStateController>
  )
}

type CheckoutEntryStateProps = {
  cartId?: string
  initialCart?: CartSummary | CheckoutOrder | null
  initialCartLoadError?: string | null
  initialCustomerEmail?: string | null
  initialPaymentError?: string | null
  initialPaymentErrorCode?: CheckoutCompletionErrorCode | null
  initialSavedAddresses?: Array<CustomerAddress>
  initialSavedPaymentCards?: Array<CustomerCreditCard>
}

export function CheckoutEntryState({
  cartId,
  initialCart,
  initialCartLoadError = null,
  initialCustomerEmail = null,
  initialPaymentError = null,
  initialPaymentErrorCode = null,
  initialSavedAddresses = [],
  initialSavedPaymentCards = [],
}: CheckoutEntryStateProps = {}) {
  const { market } = useMarket()
  const navigate = useNavigate()
  const cartQuery = useCart({
    enabled: !cartId,
    initialCart: cartId ? undefined : initialCart,
    refetchOnMount: !cartId && initialCart ? false : undefined,
    staleTime: !cartId && initialCart ? 30_000 : undefined,
  })
  const checkoutOrderQuery = useCheckoutOrder({
    cartId,
    enabled: Boolean(cartId),
    initialOrder: isCheckoutOrder(initialCart) ? initialCart : undefined,
    refetchOnMount: cartId && initialCart ? false : undefined,
    staleTime: cartId && initialCart ? 30_000 : undefined,
  })
  const checkoutCartSnapshotQuery = useCart({
    cartId,
    enabled: Boolean(cartId),
    refetchOnMount: 'always',
    retry: false,
    staleTime: 0,
  })
  const resetCartSession = useResetCartSession()
  const activeQuery = cartId ? checkoutOrderQuery : cartQuery
  const cart = activeQuery.data
  const error = activeQuery.error
  const isFetched = activeQuery.isFetched
  const isLoading = activeQuery.isLoading
  const cartLoadError =
    error ?? (!isFetched || !cart ? initialCartLoadError : null)
  const cartLoadErrorMessage =
    cartLoadError instanceof Error ? cartLoadError.message : cartLoadError
  const checkoutCartSnapshot = checkoutCartSnapshotQuery.data
  const refetchCheckoutOrder = checkoutOrderQuery.refetch

  useEffect(() => {
    if (!cartId || !isCheckoutOrder(cart) || !checkoutCartSnapshot) {
      return
    }

    if (checkoutCartSnapshot.id !== cart.id) {
      return
    }

    if (!cartLineItemsChanged(cart, checkoutCartSnapshot)) {
      return
    }

    void refetchCheckoutOrder()
  }, [cart, cartId, checkoutCartSnapshot, refetchCheckoutOrder])

  async function recoverCheckoutSession() {
    await resetCartSession.mutateAsync()
    await navigate({
      params: {
        country: market.country,
        locale: market.locale,
      },
      replace: true,
      to: '/$country/$locale/checkout',
    })
  }

  if (isLoading && !initialCartLoadError) {
    return <CheckoutLoadingState />
  }

  if (cartLoadError) {
    return (
      <CheckoutLoadErrorState
        errorMessage={cartLoadErrorMessage}
        isResetPending={resetCartSession.isPending}
        onReset={() => void recoverCheckoutSession()}
      />
    )
  }

  if (!cart || cart.items.length === 0) {
    return <CheckoutUnavailableState />
  }

  if (!isCheckoutOrder(cart)) {
    return <CheckoutUnavailableState />
  }

  return (
    <CheckoutReadyState
      cart={cart}
      customerEmail={initialCustomerEmail}
      initialPaymentError={initialPaymentError}
      initialPaymentErrorCode={initialPaymentErrorCode}
      savedAddresses={initialSavedAddresses}
      savedPaymentCards={initialSavedPaymentCards}
    />
  )
}
