import type { Money } from '@/lib/core/money'
import { getConfirmedCartDeliveryTotal } from './confirmed-delivery-total'
import type { CartSummary } from './cart'

export type CartShippingSummary =
  { kind: 'calculated' } | { amount: Money; kind: 'amount' } | { kind: 'free' }

export function getCartShippingSummary(
  cart: Pick<CartSummary, 'deliveryTotal' | 'shippingRates'>,
): CartShippingSummary {
  const shipping = getConfirmedCartDeliveryTotal(cart)

  if (!shipping) {
    return { kind: 'calculated' }
  }

  return shipping.amount === 0
    ? { kind: 'free' }
    : { amount: shipping, kind: 'amount' }
}
