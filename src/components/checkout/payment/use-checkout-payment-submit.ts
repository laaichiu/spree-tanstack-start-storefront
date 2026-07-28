import { useCallback, useState } from 'react'
import type { RefObject } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'

import { submitCheckoutPayment } from './checkout-payment-submit-flow'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import {
  useCompleteCheckoutOrder,
  useCompleteCheckoutPaymentSession,
  useCreateDirectCheckoutPayment,
} from './use-checkout-payment'

export type { CheckoutPaymentSubmitResult } from './checkout-payment-submit-result'

export function useCheckoutPaymentSubmit({
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
}: {
  cart: CheckoutOrder
  clientSecret?: string
  isStripeElementReady: boolean
  paymentSession: CheckoutPaymentSession | null
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedPaymentProfileIdForSession: string | null
  selectedShippingRate: CartShippingRate | null
  setPaymentError: (error: string | null) => void
  shippingReady: boolean
  stripePaymentHandleRef: RefObject<StripePaymentElementHandle | null>
}) {
  const { market, t } = useMarket()
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const completePaymentSession = useCompleteCheckoutPaymentSession({
    cartId: cart.id,
  })
  const createDirectPayment = useCreateDirectCheckoutPayment({
    cartId: cart.id,
  })
  const completeOrder = useCompleteCheckoutOrder({
    cartId: cart.id,
  })
  const completePaymentSessionAsync = completePaymentSession.mutateAsync
  const createDirectPaymentAsync = createDirectPayment.mutateAsync
  const completeOrderAsync = completeOrder.mutateAsync
  const isSubmittingPayment =
    completePaymentSession.isPending ||
    createDirectPayment.isPending ||
    completeOrder.isPending ||
    isConfirmingPayment

  const submitPayment = useCallback(
    () =>
      submitCheckoutPayment({
        amountDue: cart.amountDue.amount,
        cartId: cart.id,
        clientSecret,
        completeOrder: completeOrderAsync,
        completePaymentSession: completePaymentSessionAsync,
        createDirectPayment: createDirectPaymentAsync,
        isStripeElementReady,
        market: {
          country: market.country,
          locale: market.locale,
        },
        onPaymentSubmitEnd: () => setIsConfirmingPayment(false),
        onPaymentSubmitStart: () => setIsConfirmingPayment(true),
        paymentSession,
        selectedPaymentMethod,
        selectedSavedPaymentProfileIdForSession,
        selectedShippingRate,
        setPaymentError,
        shippingReady,
        stripePaymentHandle: stripePaymentHandleRef.current,
        t,
      }),
    [
      cart.amountDue.amount,
      cart.id,
      clientSecret,
      completeOrderAsync,
      completePaymentSessionAsync,
      createDirectPaymentAsync,
      isStripeElementReady,
      market.country,
      market.locale,
      paymentSession,
      selectedPaymentMethod,
      selectedSavedPaymentProfileIdForSession,
      selectedShippingRate,
      setPaymentError,
      shippingReady,
      stripePaymentHandleRef,
      t,
    ],
  )

  return {
    isSubmittingPayment,
    submitPayment,
  }
}
