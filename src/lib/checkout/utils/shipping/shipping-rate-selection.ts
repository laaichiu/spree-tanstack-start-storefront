import type { CartShippingRate } from '@/lib/cart/model/cart'

import type { CheckoutOrder } from '../../model/checkout'

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

export function getCheckoutPaymentStateKey(order: CheckoutOrder) {
  const selectedRate = getSelectedCheckoutShippingRate(order)

  return [
    order.id,
    order.currencyCode,
    selectedRate?.fulfillmentId ?? '',
    selectedRate?.id ?? '',
    order.itemTotal?.amount ?? '',
    order.deliveryTotal?.amount ?? '',
    order.taxTotal?.amount ?? '',
    order.total?.amount ?? '',
    order.amountDue?.amount ?? '',
  ].join(':')
}
