import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'

import type { ExpressCheckoutOrderResult } from '@/lib/checkout/api/express/checkout-express.types'
import {
  buildExpressCheckoutShippingRateMap,
  getExpressCheckoutSelectedShippingAmount,
  getLineItemsAmount,
} from '@/lib/checkout/utils/express/express-checkout'
import type { ExpressCheckoutRateSelection } from '@/lib/checkout/utils/express/express-checkout'
import type { MessageKey } from '@/lib/i18n/messages'

import type {
  ExpressCheckoutPartialAddressInput,
  ExpressCheckoutRateSelectionInput,
} from './use-express-checkout-shipping-actions'
import type { ExpressCheckoutLineItemsBuilder } from './use-express-checkout-line-items'

type ExpressCheckoutShippingActions = {
  resolveShipping: (
    address: ExpressCheckoutPartialAddressInput,
  ) => Promise<ExpressCheckoutOrderResult>
  selectShippingRates: (
    selections: ExpressCheckoutRateSelectionInput[],
  ) => Promise<ExpressCheckoutOrderResult>
}

type ExpressCheckoutShippingFlowOptions = {
  actions: ExpressCheckoutShippingActions
  buildLineItems: ExpressCheckoutLineItemsBuilder
  isGooglePay: boolean
  setError: (error: string | null) => void
  setShippingRateMap: (map: Map<string, ExpressCheckoutRateSelection[]>) => void
  t: (key: MessageKey) => string
  updateElementsAmount: (amount: number) => void
}

export async function handleExpressCheckoutShippingAddressChange({
  actions,
  buildLineItems,
  event,
  isGooglePay,
  setError,
  setShippingRateMap,
  t,
  updateElementsAmount,
}: ExpressCheckoutShippingFlowOptions & {
  event: StripeExpressCheckoutElementShippingAddressChangeEvent
}) {
  try {
    const state = event.address.state.trim() || undefined
    const result = await actions.resolveShipping({
      city: event.address.city,
      countryIso: event.address.country,
      postalCode: event.address.postal_code,
      stateAbbr: state && state.length <= 3 ? state : undefined,
      stateName: state,
    })

    if (!result.success) {
      setError(result.error)
      event.reject()
      return
    }

    const { selectionMap, shippingRates } = buildExpressCheckoutShippingRateMap(
      {
        isGooglePay,
        rates: result.order.shippingRates,
      },
    )

    setShippingRateMap(selectionMap)

    if (!shippingRates.length) {
      setError(t('checkout.shippingMethodPlaceholder'))
      event.reject()
      return
    }

    const lineItems = buildLineItems(result.order, {
      amountDueShippingAmount:
        getExpressCheckoutSelectedShippingAmount(result.order) ?? undefined,
      shippingAmount: shippingRates[0].amount,
    })
    updateElementsAmount(getLineItemsAmount(lineItems))
    setError(null)
    event.resolve({
      lineItems,
      shippingRates,
    })
  } catch {
    setError(t('checkout.shippingMethodSaveFailed'))
    event.reject()
  }
}

export async function handleExpressCheckoutShippingRateChange({
  actions,
  buildLineItems,
  event,
  setError,
  shippingRateMap,
  t,
  updateElementsAmount,
}: Omit<
  ExpressCheckoutShippingFlowOptions,
  'isGooglePay' | 'setShippingRateMap'
> & {
  event: StripeExpressCheckoutElementShippingRateChangeEvent
  shippingRateMap: ReadonlyMap<string, ExpressCheckoutRateSelection[]>
}) {
  try {
    const selections = shippingRateMap.get(event.shippingRate.id)

    if (!selections?.length) {
      setError(t('checkout.shippingMethodSaveFailed'))
      event.reject()
      return
    }

    const result = await actions.selectShippingRates(selections)

    if (!result.success) {
      setError(result.error)
      event.reject()
      return
    }

    const lineItems = buildLineItems(result.order, {
      amountDueShippingAmount: event.shippingRate.amount,
      shippingAmount: event.shippingRate.amount,
    })
    updateElementsAmount(getLineItemsAmount(lineItems))
    setError(null)
    event.resolve({
      lineItems,
    })
  } catch {
    setError(t('checkout.shippingMethodSaveFailed'))
    event.reject()
  }
}
