import type {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { getCheckoutPaymentStateKey } from '@/lib/checkout/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { useMarket } from '@/components/layout/market-provider'

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
  const { market } = useMarket()
  const ownerKey = JSON.stringify([
    getCheckoutPaymentStateKey(cart),
    market.country,
    market.locale,
  ])
  const actions = useExpressCheckoutActions({
    cartId: cart.id,
  })
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const isGooglePayRef = useRef(false)
  const ownerGenerationRef = useRef(0)
  const previousOwnerKeyRef = useRef(ownerKey)

  if (previousOwnerKeyRef.current !== ownerKey) {
    previousOwnerKeyRef.current = ownerKey
    ownerGenerationRef.current += 1
  }

  const ownerGeneration = ownerGenerationRef.current
  const currentOwnerRef = useRef<string | null>(ownerKey)

  if (currentOwnerRef.current !== ownerKey) {
    currentOwnerRef.current = ownerKey
  }

  useEffect(() => {
    setAvailable(null)
    setError(null)
    setProcessing(false)
    isGooglePayRef.current = false

    return () => {
      if (currentOwnerRef.current === ownerKey) {
        currentOwnerRef.current = null
      }
    }
  }, [ownerKey])

  const isCurrentOwner = useCallback(
    () =>
      currentOwnerRef.current === ownerKey &&
      ownerGenerationRef.current === ownerGeneration,
    [ownerGeneration, ownerKey],
  )

  const stripeMethod = getCheckoutExpressCheckoutStripeMethod(cart)
  const { buildCurrentLineItems, buildLineItems, updateElementsAmount } =
    useExpressCheckoutLineItems({ cart })
  const { handleShippingAddressChange, handleShippingRateChange } =
    useExpressCheckoutShipping({
      actions,
      buildLineItems,
      isGooglePayRef,
      ownerKey,
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
      if (!isCurrentOwner()) {
        return
      }

      const methods = event.availablePaymentMethods
      const isAvailable = Boolean(
        methods && (methods.applePay || methods.googlePay || methods.link),
      )

      setAvailable(isAvailable)
    },
    [isCurrentOwner],
  )

  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      if (!isCurrentOwner()) {
        event.reject()
        return
      }

      isGooglePayRef.current = event.expressPaymentType === 'google_pay'
      event.resolve({
        lineItems: buildCurrentLineItems(cart),
      })
    },
    [buildCurrentLineItems, cart, isCurrentOwner],
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
