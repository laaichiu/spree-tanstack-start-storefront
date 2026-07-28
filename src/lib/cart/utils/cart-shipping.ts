import type { CartSummary } from '@/lib/cart/model/cart'
import type { Money } from '@/lib/money/money'

export function getConfirmedCartDeliveryTotal(cart: CartSummary): Money | null {
  const hasSelectedShippingRate = cart.shippingRates.some(
    (rate) => rate.selected,
  )

  return cart.deliveryTotal.amount !== 0 || hasSelectedShippingRate
    ? cart.deliveryTotal
    : null
}
