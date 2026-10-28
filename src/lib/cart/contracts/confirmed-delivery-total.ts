import type { Money } from '@/lib/core/money'
import type { CartSummary } from './cart'

type CartDeliveryTotalInput = Pick<
  CartSummary,
  'deliveryTotal' | 'shippingRates'
>

export function getConfirmedCartDeliveryTotal(
  cart: CartDeliveryTotalInput,
): Money | null {
  const hasSelectedShippingRate = cart.shippingRates.some(
    (rate) => rate.selected,
  )

  return !cart.deliveryTotal
    ? null
    : cart.deliveryTotal.amount !== 0 || hasSelectedShippingRate
      ? cart.deliveryTotal
      : null
}
