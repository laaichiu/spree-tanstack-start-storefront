import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { useCallback, useRef } from 'react'
import type { MutableRefObject } from 'react'

import {
  handleExpressCheckoutShippingAddressChange,
  handleExpressCheckoutShippingRateChange,
} from './express-checkout-shipping-flow'
import { useMarket } from '@/components/layout/market-provider'
import type { ExpressCheckoutRateSelection } from '@/lib/checkout/utils/express/express-checkout'

import type { useExpressCheckoutActions } from './use-express-checkout'
import type { ExpressCheckoutLineItemsBuilder } from './use-express-checkout-line-items'

type ExpressCheckoutActions = ReturnType<typeof useExpressCheckoutActions>

type ExpressCheckoutShippingOptions = {
  actions: Pick<
    ExpressCheckoutActions,
    'resolveShipping' | 'selectShippingRates'
  >
  buildLineItems: ExpressCheckoutLineItemsBuilder
  isGooglePayRef: MutableRefObject<boolean>
  setError: (error: string | null) => void
  updateElementsAmount: (amount: number) => void
}

export function useExpressCheckoutShipping({
  actions,
  buildLineItems,
  isGooglePayRef,
  setError,
  updateElementsAmount,
}: ExpressCheckoutShippingOptions) {
  const { t } = useMarket()
  const shippingRateMapRef = useRef<
    Map<string, ExpressCheckoutRateSelection[]>
  >(new Map())

  const handleShippingAddressChange = useCallback(
    (event: StripeExpressCheckoutElementShippingAddressChangeEvent) =>
      handleExpressCheckoutShippingAddressChange({
        actions,
        buildLineItems,
        event,
        isGooglePay: isGooglePayRef.current,
        setError,
        setShippingRateMap: (map) => {
          shippingRateMapRef.current = map
        },
        t,
        updateElementsAmount,
      }),
    [
      actions,
      buildLineItems,
      isGooglePayRef,
      setError,
      t,
      updateElementsAmount,
    ],
  )

  const handleShippingRateChange = useCallback(
    (event: StripeExpressCheckoutElementShippingRateChangeEvent) =>
      handleExpressCheckoutShippingRateChange({
        actions,
        buildLineItems,
        event,
        setError,
        shippingRateMap: shippingRateMapRef.current,
        t,
        updateElementsAmount,
      }),
    [actions, buildLineItems, setError, t, updateElementsAmount],
  )

  return {
    handleShippingAddressChange,
    handleShippingRateChange,
  }
}
