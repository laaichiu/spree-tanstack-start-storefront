import type { CartShippingRate } from '../../cart/contracts'
import type { CheckoutOrder } from './checkout'
import { getCheckoutShippingRateIdentity } from './shipping-rate-reference'

function hasSameRateDisplayPrice(
  left: CartShippingRate,
  right: CartShippingRate,
) {
  return (
    left.displayPrice.currencyCode === right.displayPrice.currencyCode &&
    left.displayPrice.amount === right.displayPrice.amount
  )
}

function hasSameRateDisplay(left: CartShippingRate, right: CartShippingRate) {
  return left.name === right.name && hasSameRateDisplayPrice(left, right)
}

export function getSelectedCheckoutShippingRate(order: CheckoutOrder) {
  return order.shippingRates.find((rate) => rate.selected) ?? null
}

/**
 * Resolves the rate selected by the checkout form while preserving Spree's
 * selected flag as the fallback when the form id is stale.
 */
export function getSelectedCheckoutShippingRateById({
  rates,
  selectedRateId,
}: {
  rates: readonly CartShippingRate[]
  selectedRateId: string
}) {
  return (
    rates.find((rate) => rate.id === selectedRateId && rate.selected) ??
    rates.find((rate) => rate.selected) ??
    null
  )
}

export function findCheckoutShippingRateByIdentity({
  identity,
  rates,
}: {
  identity: string
  rates: readonly CartShippingRate[]
}) {
  return (
    rates.find((rate) => getCheckoutShippingRateIdentity(rate) === identity) ??
    null
  )
}

export function hasCheckoutSelectedShippingRate(order: CheckoutOrder) {
  return Boolean(getSelectedCheckoutShippingRate(order))
}

export function shouldRefreshCheckoutOrderWithUpdate(order: CheckoutOrder) {
  if (order.shippingRates.length === 0) {
    return true
  }

  return (
    order.amountDue !== null &&
    order.amountDue.amount > 0 &&
    order.paymentMethods.length === 0 &&
    hasCheckoutSelectedShippingRate(order)
  )
}

export function findMatchingCheckoutShippingRate({
  preferredRate,
  rates,
}: {
  preferredRate: CartShippingRate | null
  rates: CartShippingRate[]
}) {
  if (!preferredRate || rates.length === 0) {
    return null
  }

  const exactRate = rates.find(
    (rate) =>
      rate.id === preferredRate.id &&
      rate.fulfillmentId === preferredRate.fulfillmentId,
  )

  if (exactRate) {
    return exactRate
  }

  const sameRateId = rates.find((rate) => rate.id === preferredRate.id)

  if (sameRateId) {
    return sameRateId
  }

  const sameFulfillmentDisplayRate = rates.find(
    (rate) =>
      rate.fulfillmentId === preferredRate.fulfillmentId &&
      hasSameRateDisplay(rate, preferredRate),
  )

  if (sameFulfillmentDisplayRate) {
    return sameFulfillmentDisplayRate
  }

  const displayMatches = rates.filter((rate) =>
    hasSameRateDisplay(rate, preferredRate),
  )

  if (displayMatches.length === 1) {
    return displayMatches[0]
  }

  return rates.length === 1 ? rates[0] : null
}
