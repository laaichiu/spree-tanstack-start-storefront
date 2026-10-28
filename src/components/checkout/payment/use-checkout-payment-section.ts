import { useCallback, useEffect, useRef } from 'react'

import type { CustomerCreditCard } from '@/lib/account/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { isStripeConfigured } from '@/lib/stripe/client'
import { useMarket } from '@/components/layout/market-provider'
import { useCheckoutPaymentSession } from '@/lib/checkout/client/use-checkout-payment-session'
import { useCheckoutPaymentSubmit } from '@/lib/checkout/client/use-checkout-payment-submit'

import { useCheckoutPaymentSelection } from './use-checkout-payment-selection'
import { useCheckoutSelectedShippingRate } from '../shipping/use-checkout-selected-shipping-rate'
import { useCheckoutStripePaymentElement } from './use-checkout-stripe-payment-element'
import {
  canAttemptCheckoutPaymentSubmit,
  getCheckoutPaymentReadiness,
} from '@/lib/checkout/contracts'
import { getCheckoutPaymentSessionKey } from '@/lib/checkout/utils/payment/payment-session'

type CheckoutPaymentSectionOptions = {
  cart: CheckoutOrder
  onBusyChange?: (busy: boolean) => void
  onPaymentSubmitReadyChange?: (ready: boolean) => void
  onSetupPendingChange?: (pending: boolean) => void
  savedPaymentCards: Array<CustomerCreditCard>
  shippingReady: boolean
}

export function useCheckoutPaymentSection({
  cart,
  onBusyChange,
  onPaymentSubmitReadyChange,
  onSetupPendingChange,
  savedPaymentCards,
  shippingReady,
}: CheckoutPaymentSectionOptions) {
  const { market, t } = useMarket()
  const paymentElementOwnerKey = JSON.stringify([
    cart.id,
    market.country,
    market.locale,
  ])
  const resetPaymentSessionRef = useRef<(() => void) | null>(null)
  const {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    isStripeElementComplete,
    isStripeElementReady,
    resetStripePaymentElement,
    stripePaymentHandleRef,
  } = useCheckoutStripePaymentElement({
    ownerKey: paymentElementOwnerKey,
  })
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
        market,
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
    market,
    onResetStripeElement: resetStripePaymentElement,
    selectedPaymentMethod,
    selectedSavedStripePaymentMethodId: selectedSavedPaymentProfileIdForSession,
    selectedSessionKey,
    selectedShippingRate,
    t,
  })
  resetPaymentSessionRef.current = resetPaymentSession
  const { isSubmittingPayment, paymentSubmissionContextKey, submitPayment } =
    useCheckoutPaymentSubmit({
      cart,
      clientSecret,
      isStripeElementReady,
      market,
      paymentSession,
      selectedPaymentMethod,
      selectedSavedPaymentProfileIdForSession,
      selectedShippingRate,
      setPaymentError,
      shippingReady,
      stripePaymentHandleRef,
      t,
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
    canAttemptCheckoutPaymentSubmit(paymentReadiness)

  useEffect(() => {
    onBusyChange?.(isBusy)
  }, [isBusy, onBusyChange])

  useEffect(() => {
    onPaymentSubmitReadyChange?.(canAttemptPaymentSubmit)
  }, [canAttemptPaymentSubmit, onPaymentSubmitReadyChange])

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
    paymentSubmissionContextKey,
    resetPaymentSession,
    retryPaymentSession,
    savedStripePaymentCards,
    selectedPaymentMethod,
    selectedSavedPaymentProfileIdForSession,
    submitPayment,
  }
}
