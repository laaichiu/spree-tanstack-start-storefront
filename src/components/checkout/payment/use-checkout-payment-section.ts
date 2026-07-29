import { useCallback, useEffect, useRef } from 'react'

import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { isStripeConfigured } from '@/lib/stripe/client'

import { useCheckoutPaymentSelection } from './use-checkout-payment-selection'
import { useCheckoutPaymentSession } from './use-checkout-payment-session'
import { useCheckoutPaymentSubmit } from './use-checkout-payment-submit'
import { useCheckoutSelectedShippingRate } from '../shipping/use-checkout-selected-shipping-rate'
import { useCheckoutStripePaymentElement } from './use-checkout-stripe-payment-element'
import { getCheckoutPaymentReadiness } from '@/lib/checkout/utils/payment/payment-readiness'
import { getCheckoutPaymentSessionKey } from '@/lib/checkout/utils/payment/payment-session'

type CheckoutPaymentSectionOptions = {
  cart: CheckoutOrder
  onBusyChange?: (busy: boolean) => void
  onReadyChange?: (ready: boolean) => void
  onSetupPendingChange?: (pending: boolean) => void
  savedPaymentCards: Array<CustomerCreditCard>
  shippingReady: boolean
}

export function useCheckoutPaymentSection({
  cart,
  onBusyChange,
  onReadyChange,
  onSetupPendingChange,
  savedPaymentCards,
  shippingReady,
}: CheckoutPaymentSectionOptions) {
  const resetPaymentSessionRef = useRef<(() => void) | null>(null)
  const {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    isStripeElementComplete,
    isStripeElementReady,
    resetStripePaymentElement,
    stripePaymentHandleRef,
  } = useCheckoutStripePaymentElement()
  const resetPaymentSessionFromSelection = useCallback(() => {
    resetPaymentSessionRef.current?.()
  }, [])
  const {
    handlePaymentMethodChange,
    handleSavedPaymentProfileChange,
    savedStripePaymentCards,
    selectedPaymentMethod,
    selectedSavedPaymentProfileIdForSession,
  } = useCheckoutPaymentSelection({
    paymentMethods: cart.paymentMethods,
    resetPaymentSession: resetPaymentSessionFromSelection,
    savedPaymentCards,
  })
  const selectedSessionKey = selectedPaymentMethod
    ? getCheckoutPaymentSessionKey({
        order: cart,
        paymentMethod: selectedPaymentMethod,
        savedPaymentMethodId: selectedSavedPaymentProfileIdForSession,
      })
    : ''
  const selectedShippingRate = useCheckoutSelectedShippingRate(cart)
  const {
    clientSecret,
    isCreatingPaymentSession,
    isPaymentSessionRetryable,
    paymentError,
    paymentSession,
    resetPaymentSession,
    retryPaymentSession,
    setPaymentError,
  } = useCheckoutPaymentSession({
    cartId: cart.id,
    onResetStripeElement: resetStripePaymentElement,
    selectedPaymentMethod,
    selectedSavedStripePaymentMethodId: selectedSavedPaymentProfileIdForSession,
    selectedSessionKey,
    selectedShippingRate,
  })
  resetPaymentSessionRef.current = resetPaymentSession
  const { isSubmittingPayment, submitPayment } = useCheckoutPaymentSubmit({
    cart,
    clientSecret,
    isStripeElementReady,
    paymentSession,
    selectedPaymentMethod,
    selectedSavedPaymentProfileIdForSession,
    selectedShippingRate,
    setPaymentError,
    shippingReady,
    stripePaymentHandleRef,
  })
  const isPaymentSetupPending = isCreatingPaymentSession
  const isBusy = isSubmittingPayment
  const isPaymentBodyBusy = isPaymentSetupPending || isSubmittingPayment
  const paymentReadiness = getCheckoutPaymentReadiness({
    clientSecretAvailable: Boolean(clientSecret),
    isBusy,
    orderTotalAmount: cart.amountDue?.amount ?? null,
    paymentSessionAvailable: Boolean(paymentSession),
    selectedPaymentMethod,
    savedPaymentMethodAvailable: Boolean(
      selectedSavedPaymentProfileIdForSession,
    ),
    stripeConfigured: isStripeConfigured,
    stripeElementComplete: isStripeElementComplete,
    stripeElementReady: isStripeElementReady,
  })
  const canAttemptPaymentSubmit =
    paymentReadiness.ready ||
    paymentReadiness.reason === 'payment_form_incomplete'

  useEffect(() => {
    onBusyChange?.(isBusy)
  }, [isBusy, onBusyChange])

  useEffect(() => {
    onReadyChange?.(canAttemptPaymentSubmit)
  }, [canAttemptPaymentSubmit, onReadyChange])

  useEffect(() => {
    onSetupPendingChange?.(isPaymentSetupPending)
  }, [isPaymentSetupPending, onSetupPendingChange])

  return {
    canAttemptPaymentSubmit,
    clientSecret,
    handlePaymentMethodChange,
    handleSavedPaymentProfileChange,
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    isBusy,
    isPaymentBodyBusy,
    isPaymentSessionRetryable,
    paymentError,
    paymentSession,
    resetPaymentSession,
    retryPaymentSession,
    savedStripePaymentCards,
    selectedPaymentMethod,
    selectedSavedPaymentProfileIdForSession,
    submitPayment,
  }
}
