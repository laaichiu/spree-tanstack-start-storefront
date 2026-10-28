import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'

import { useCreateCheckoutPaymentSession } from './use-checkout-payment'
import { useCheckoutPaymentSessionInitialization } from './use-checkout-payment-session-initialization'
import { useCheckoutPaymentSessionState } from './use-checkout-payment-session-state'

export function useCheckoutPaymentSession({
  cartId,
  market,
  onResetStripeElement,
  selectedPaymentMethod,
  selectedSavedStripePaymentMethodId,
  selectedSessionKey,
  selectedShippingRate,
  t,
}: {
  cartId: string
  market: MarketSelectionInput
  onResetStripeElement: () => void
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedStripePaymentMethodId: string | null
  selectedSessionKey: string
  selectedShippingRate: CartShippingRate | null
  t: (key: MessageKey) => string
}) {
  const {
    isPending: isCreatingPaymentSession,
    mutateAsync: createPaymentSessionAsync,
  } = useCreateCheckoutPaymentSession({
    cartId,
    market,
  })
  const sessionState = useCheckoutPaymentSessionState({
    onResetStripeElement,
    ownerKey: JSON.stringify([
      cartId,
      market.country,
      market.locale,
      selectedSessionKey,
    ]),
  })

  useCheckoutPaymentSessionInitialization({
    cartId,
    createPaymentSessionAsync,
    lastPaymentSessionKeyRef: sessionState.lastPaymentSessionKeyRef,
    market,
    onResetStripeElement,
    paymentSessionGenerationRef: sessionState.paymentSessionGenerationRef,
    paymentSessionRetryKey: sessionState.paymentSessionRetryKey,
    resetPaymentSession: sessionState.resetPaymentSession,
    selectedPaymentMethod,
    selectedSavedStripePaymentMethodId,
    selectedSessionKey,
    selectedShippingRate,
    setIsPaymentSessionRetryable: sessionState.setIsPaymentSessionRetryable,
    setPaymentError: sessionState.setPaymentError,
    setPaymentSession: sessionState.setPaymentSession,
    t,
  })

  return {
    clientSecret: sessionState.clientSecret,
    isCreatingPaymentSession,
    isPaymentSessionRetryable: sessionState.isPaymentSessionRetryable,
    paymentError: sessionState.paymentError,
    paymentSession: sessionState.paymentSession,
    retryPaymentSession: sessionState.retryPaymentSession,
    resetPaymentSession: sessionState.resetPaymentSession,
    setPaymentError: sessionState.setPaymentError,
  }
}
