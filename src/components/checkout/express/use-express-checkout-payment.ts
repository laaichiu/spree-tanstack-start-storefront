import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useNavigate } from '@tanstack/react-router'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'
import { useCallback, useRef } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'

import { runExpressCheckoutPayment } from './express-checkout-payment-flow'
import type { useExpressCheckoutActions } from './use-express-checkout'

type ExpressCheckoutActions = ReturnType<typeof useExpressCheckoutActions>

type ExpressCheckoutPaymentOptions = {
  actions: ExpressCheckoutActions
  cart: CheckoutOrder
  setError: (error: string | null) => void
  setProcessing: (processing: boolean) => void
  stripeMethod: CheckoutPaymentMethod | null
}

export function useExpressCheckoutPayment({
  actions,
  cart,
  setError,
  setProcessing,
  stripeMethod,
}: ExpressCheckoutPaymentOptions) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { market, t } = useMarket()
  const isConfirmingRef = useRef(false)

  const redirectToConfirmation = useCallback(
    async (sessionId?: string) => {
      await navigate({
        params: {
          country: market.country,
          id: cart.id,
          locale: market.locale,
        },
        search: {
          session: sessionId,
        },
        to: '/$country/$locale/confirm-payment/$id',
      })
    },
    [cart.id, market.country, market.locale, navigate],
  )

  const redirectToOrderPlaced = useCallback(
    async (orderId: string) => {
      await navigate({
        params: {
          country: market.country,
          id: orderId,
          locale: market.locale,
        },
        to: '/$country/$locale/order-placed/$id',
      })
    },
    [market.country, market.locale, navigate],
  )

  return useCallback(
    (event: StripeExpressCheckoutElementConfirmEvent) =>
      runExpressCheckoutPayment({
        actions,
        cartId: cart.id,
        elements,
        event,
        isConfirmingRef,
        market: {
          country: market.country,
          locale: market.locale,
        },
        redirectToConfirmation,
        redirectToOrderPlaced,
        setError,
        setProcessing,
        stripe,
        stripeMethod,
        t,
      }),
    [
      actions,
      cart.id,
      elements,
      market.country,
      market.locale,
      redirectToConfirmation,
      redirectToOrderPlaced,
      setError,
      setProcessing,
      stripe,
      stripeMethod,
      t,
    ],
  )
}
