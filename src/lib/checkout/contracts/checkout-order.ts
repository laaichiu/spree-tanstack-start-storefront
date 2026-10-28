import type { CheckoutOrder } from './checkout'

export function getCheckoutOrderResourceId(
  order: Pick<CheckoutOrder, 'id' | 'orderResourceId'>,
) {
  return order.orderResourceId ?? order.id
}

export function isCheckoutOrder(value: unknown): value is CheckoutOrder {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('paymentMethods' in value) ||
    !('requirements' in value)
  ) {
    return false
  }

  return (
    Array.isArray(value.paymentMethods) && Array.isArray(value.requirements)
  )
}
