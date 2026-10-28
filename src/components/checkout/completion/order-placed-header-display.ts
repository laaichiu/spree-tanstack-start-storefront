import type { CheckoutOrder } from '@/lib/checkout/contracts'

export type OrderPlacedHeaderDisplay = {
  email: string | null
  firstName: string | null
  number: string
}

type OrderPlacedHeaderAddress = Pick<
  NonNullable<CheckoutOrder['shippingAddress']>,
  'firstName' | 'fullName'
>

export function getOrderPlacedHeaderDisplay(order: {
  billingAddress: OrderPlacedHeaderAddress | null
  email: string | null
  id: string
  number?: string | null
  shippingAddress: OrderPlacedHeaderAddress | null
}): OrderPlacedHeaderDisplay {
  const address = order.shippingAddress ?? order.billingAddress
  const firstName =
    address?.firstName?.trim() ||
    address?.fullName.split(' ').filter(Boolean)[0] ||
    null

  return {
    email: order.email,
    firstName,
    number: order.number?.trim() || order.id,
  }
}
