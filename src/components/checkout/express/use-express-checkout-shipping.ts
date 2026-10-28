import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { useCallback, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

import {
  handleExpressCheckoutShippingAddressChange,
  handleExpressCheckoutShippingRateChange,
} from '@/lib/checkout/utils/express/express-checkout-shipping-flow'
import { useMarket } from '@/components/layout/market-provider'
import type { ExpressCheckoutRateSelection } from '@/lib/checkout/utils/express/express-checkout'
import type {
  ExpressCheckoutLineItemsBuilder,
  ExpressCheckoutShippingActions,
} from '@/lib/checkout/utils/express/express-checkout-actions'

type ExpressCheckoutShippingOptions = {
  actions: ExpressCheckoutShippingActions
  buildLineItems: ExpressCheckoutLineItemsBuilder
  isGooglePayRef: MutableRefObject<boolean>
  ownerKey: string
  setError: (error: string | null) => void
  updateElementsAmount: (amount: number) => void
}

export function useExpressCheckoutShipping({
  actions,
  buildLineItems,
  isGooglePayRef,
  ownerKey,
  setError,
  updateElementsAmount,
}: ExpressCheckoutShippingOptions) {
  const { t } = useMarket()
  const shippingRateMapRef = useRef<
    Map<string, ExpressCheckoutRateSelection[]>
  >(new Map())
  const currentOwnerRef = useRef<string | null>(ownerKey)
  const shippingEventGenerationRef = useRef(0)

  if (currentOwnerRef.current !== ownerKey) {
    currentOwnerRef.current = ownerKey
    shippingEventGenerationRef.current += 1
    shippingRateMapRef.current = new Map()
  }

  useEffect(() => {
    return () => {
      if (currentOwnerRef.current !== ownerKey) {
        return
      }

      currentOwnerRef.current = null
      shippingEventGenerationRef.current += 1
      shippingRateMapRef.current = new Map()
    }
  }, [ownerKey])

  const isCurrentOwner = useCallback(
    (generation: number) =>
      currentOwnerRef.current === ownerKey &&
      shippingEventGenerationRef.current === generation,
    [ownerKey],
  )

  const handleShippingAddressChange = useCallback(
    (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
      const generation = ++shippingEventGenerationRef.current
      shippingRateMapRef.current = new Map()

      return handleExpressCheckoutShippingAddressChange({
        actions,
        buildLineItems,
        event,
        isGooglePay: isGooglePayRef.current,
        isCurrent: () => isCurrentOwner(generation),
        setError,
        setShippingRateMap: (map) => {
          shippingRateMapRef.current = map
        },
        t,
        updateElementsAmount,
      })
    },
    [
      actions,
      buildLineItems,
      isGooglePayRef,
      isCurrentOwner,
      setError,
      t,
      updateElementsAmount,
    ],
  )

  const handleShippingRateChange = useCallback(
    (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
      const generation = ++shippingEventGenerationRef.current

      return handleExpressCheckoutShippingRateChange({
        actions,
        buildLineItems,
        event,
        isCurrent: () => isCurrentOwner(generation),
        setError,
        shippingRateMap: shippingRateMapRef.current,
        t,
        updateElementsAmount,
      })
    },
    [
      actions,
      buildLineItems,
      isCurrentOwner,
      setError,
      t,
      updateElementsAmount,
    ],
  )

  return {
    handleShippingAddressChange,
    handleShippingRateChange,
  }
}
