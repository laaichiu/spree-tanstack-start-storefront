import type {
  CheckoutFulfillment,
  CheckoutOrder,
  CheckoutPayment,
} from './checkout'

export function getOrderPlacedPaymentStatus(order: {
  paymentStatus?: CheckoutOrder['paymentStatus']
  payments?: readonly CheckoutPayment[]
}) {
  return order.paymentStatus ?? order.payments?.[0]?.status ?? null
}

export function getOrderPlacedFulfillmentStatus(order: {
  fulfillmentStatus?: CheckoutOrder['fulfillmentStatus']
  fulfillments?: readonly CheckoutFulfillment[]
}) {
  return order.fulfillmentStatus ?? order.fulfillments?.[0]?.status ?? null
}
