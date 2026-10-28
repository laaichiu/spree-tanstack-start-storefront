import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'

import {
  buildExpressCheckoutShippingRateMap,
  getExpressCheckoutSelectedShippingAmount,
  getLineItemsAmount,
} from './express-checkout'
import type { ExpressCheckoutRateSelection } from './express-checkout'
import type {
  ExpressCheckoutLineItemsBuilder,
  ExpressCheckoutShippingActions,
} from './express-checkout-actions'
import type { MessageKey } from '@/lib/i18n/messages'
import { readCheckoutMutationErrorMessage } from '../checkout-error'

export type ExpressCheckoutShippingFlowOptions = {
  actions: ExpressCheckoutShippingActions
  buildLineItems: ExpressCheckoutLineItemsBuilder
  isGooglePay: boolean
  isCurrent: () => boolean
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
  isCurrent = () => true,
  setError,
  setShippingRateMap,
  t,
  updateElementsAmount,
}: ExpressCheckoutShippingFlowOptions & {
  event: StripeExpressCheckoutElementShippingAddressChangeEvent
}) {
  try {
    if (!isCurrent()) {
      event.reject()
      return
    }

    const state = event.address.state.trim() || undefined
    const result = await actions.resolveShipping({
      city: event.address.city,
      countryIso: event.address.country,
      postalCode: event.address.postal_code,
      stateAbbr: state && state.length <= 3 ? state : undefined,
      stateName: state,
    })

    if (!isCurrent()) {
      event.reject()
      return
    }

    if (!result.success) {
      setError(
        readCheckoutMutationErrorMessage(
          result.error,
          t('checkout.shippingMethodSaveFailed'),
        ),
      )
      event.reject()
      return
    }

    const { selectionMap, shippingRates } = buildExpressCheckoutShippingRateMap(
      {
        isGooglePay,
        rates: result.order.shippingRates,
      },
    )

    if (!shippingRates.length) {
      setShippingRateMap(new Map())
      setError(t('checkout.shippingMethodPlaceholder'))
      event.reject()
      return
    }

    setShippingRateMap(selectionMap)

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
    if (!isCurrent()) {
      event.reject()
      return
    }

    setError(t('checkout.shippingMethodSaveFailed'))
    event.reject()
  }
}

export async function handleExpressCheckoutShippingRateChange({
  actions,
  buildLineItems,
  event,
  isCurrent = () => true,
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
    if (!isCurrent()) {
      event.reject()
      return
    }

    const selections = shippingRateMap.get(event.shippingRate.id)

    if (!selections?.length) {
      setError(t('checkout.shippingMethodSaveFailed'))
      event.reject()
      return
    }

    const result = await actions.selectShippingRates(selections)

    if (!isCurrent()) {
      event.reject()
      return
    }

    if (!result.success) {
      setError(
        readCheckoutMutationErrorMessage(
          result.error,
          t('checkout.shippingMethodSaveFailed'),
        ),
      )
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
    if (!isCurrent()) {
      event.reject()
      return
    }

    setError(t('checkout.shippingMethodSaveFailed'))
    event.reject()
  }
}
