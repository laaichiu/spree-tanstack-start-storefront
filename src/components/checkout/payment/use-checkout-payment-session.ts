import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'

import { useCreateCheckoutPaymentSession } from './use-checkout-payment'
import { useCheckoutPaymentSessionInitialization } from './use-checkout-payment-session-initialization'
import { useCheckoutPaymentSessionState } from './use-checkout-payment-session-state'

export function useCheckoutPaymentSession({
  cartId,
  onResetStripeElement,
  selectedPaymentMethod,
  selectedSavedStripePaymentMethodId,
  selectedSessionKey,
  selectedShippingRate,
}: {
  cartId: string
  onResetStripeElement: () => void
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedStripePaymentMethodId: string | null
  selectedSessionKey: string
  selectedShippingRate: CartShippingRate | null
}) {
  const {
    isPending: isCreatingPaymentSession,
    mutateAsync: createPaymentSessionAsync,
  } = useCreateCheckoutPaymentSession({
    cartId,
  })
  const sessionState = useCheckoutPaymentSessionState({
    onResetStripeElement,
  })

  useCheckoutPaymentSessionInitialization({
    cartId,
    createPaymentSessionAsync,
    paymentSessionGenerationRef: sessionState.paymentSessionGenerationRef,
    lastPaymentSessionKeyRef: sessionState.lastPaymentSessionKeyRef,
    onResetStripeElement,
    selectedPaymentMethod,
    selectedSavedStripePaymentMethodId,
    selectedSessionKey,
    selectedShippingRate,
    paymentSessionRetryKey: sessionState.paymentSessionRetryKey,
    resetPaymentSession: sessionState.resetPaymentSession,
    setIsPaymentSessionRetryable: sessionState.setIsPaymentSessionRetryable,
    setPaymentError: sessionState.setPaymentError,
    setPaymentSession: sessionState.setPaymentSession,
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
