import type { CartSummary } from '../../cart/contracts'

type CheckoutAppliedCodeCart = Pick<
  CartSummary,
  'appliedDiscounts' | 'appliedGiftCard'
>

export function hasCheckoutAllCodesApplied(
  cart: CheckoutAppliedCodeCart,
): boolean {
  return (
    cart.appliedDiscounts.some((discount) => Boolean(discount.code)) &&
    Boolean(cart.appliedGiftCard)
  )
}
