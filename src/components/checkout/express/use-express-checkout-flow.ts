import type {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'
import { useCallback, useRef, useState } from 'react'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { useExpressCheckoutActions } from './use-express-checkout'
import { useExpressCheckoutLineItems } from './use-express-checkout-line-items'
import { useExpressCheckoutPayment } from './use-express-checkout-payment'
import { useExpressCheckoutShipping } from './use-express-checkout-shipping'

function getCheckoutExpressCheckoutStripeMethod(order: CheckoutOrder) {
  return (
    order.paymentMethods.find(
      (method) => method.gatewayId === 'stripe' && method.sessionRequired,
    ) ?? null
  )
}

export function useExpressCheckoutFlow({ cart }: { cart: CheckoutOrder }) {
  const actions = useExpressCheckoutActions({
    cartId: cart.id,
  })
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const isGooglePayRef = useRef(false)
  const stripeMethod = getCheckoutExpressCheckoutStripeMethod(cart)
  const { buildCurrentLineItems, buildLineItems, updateElementsAmount } =
    useExpressCheckoutLineItems({ cart })
  const { handleShippingAddressChange, handleShippingRateChange } =
    useExpressCheckoutShipping({
      actions,
      buildLineItems,
      isGooglePayRef,
      setError,
      updateElementsAmount,
    })
  const handleConfirm = useExpressCheckoutPayment({
    actions,
    cart,
    setError,
    setProcessing,
    stripeMethod,
  })

  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      const methods = event.availablePaymentMethods
      const isAvailable = Boolean(
        methods && (methods.applePay || methods.googlePay || methods.link),
      )

      setAvailable(isAvailable)
    },
    [],
  )

  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      isGooglePayRef.current = event.expressPaymentType === 'google_pay'
      event.resolve({
        lineItems: buildCurrentLineItems(cart),
      })
    },
    [buildCurrentLineItems, cart],
  )

  return {
    available,
    error,
    handleClick,
    handleConfirm,
    handleReady,
    handleShippingAddressChange,
    handleShippingRateChange,
    processing,
    stripeMethod,
  }
}
