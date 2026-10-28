import type { CheckoutOrder } from './checkout'
import { getSelectedCheckoutShippingRate } from './shipping-rate-selection'

/**
 * Returns the normalized checkout fields that can invalidate a payment
 * session or a queued payment submit.
 */
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
