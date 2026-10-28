import type { Money } from '@/lib/core/money'
import { getConfirmedCartDeliveryTotal } from './confirmed-delivery-total'
import type { CartSummary } from './cart'

export type CartSummaryAmountCart = Pick<
  CartSummary,
  | 'deliveryTotal'
  | 'discountTotal'
  | 'itemTotal'
  | 'shippingRates'
  | 'taxTotal'
  | 'total'
>

export type CartSummaryAmounts = {
  discount: Money | null
  itemTotal: Money | null
  shipping: Money | null
  tax: Money | null
  total: Money | null
}

export function getCartSummaryAmounts(
  cart: CartSummaryAmountCart,
): CartSummaryAmounts {
  return {
    discount:
      cart.discountTotal && cart.discountTotal.amount < 0
        ? cart.discountTotal
        : null,
    itemTotal: cart.itemTotal,
    shipping: getConfirmedCartDeliveryTotal(cart),
    tax: cart.taxTotal && cart.taxTotal.amount > 0 ? cart.taxTotal : null,
    total: cart.total,
  }
}
