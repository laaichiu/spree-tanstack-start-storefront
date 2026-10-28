import type { CartSummary } from '../../cart/contracts'

export type CheckoutSummaryLineVisibility = {
  showDiscount: boolean
  showTax: boolean
}

export function getCheckoutSummaryLineVisibility(
  cart: Pick<CartSummary, 'discountTotal' | 'taxTotal'>,
): CheckoutSummaryLineVisibility {
  return {
    showDiscount: (cart.discountTotal?.amount ?? 0) < 0,
    showTax: (cart.taxTotal?.amount ?? 0) > 0,
  }
}
