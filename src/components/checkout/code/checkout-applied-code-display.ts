import type { CartSummary } from '@/lib/cart/contracts'
import { formatMoney } from '@/components/shared/money-display'

export type CheckoutAppliedCodePresentation = {
  amount: string
  code: string
  id: string
  kind: 'discount' | 'gift-card'
  label: string
}

export function getCheckoutAppliedCodePresentations({
  cart,
  locale,
}: {
  cart: Pick<CartSummary, 'appliedDiscounts' | 'appliedGiftCard' | 'couponCode'>
  locale: string
}): CheckoutAppliedCodePresentation[] {
  const discounts = cart.appliedDiscounts.flatMap((discount) => {
    if (!discount.code) {
      return []
    }

    return [
      {
        amount: formatMoney(discount.amount, locale),
        // Spree's applied-promotion serializer exposes the promotion code,
        // while cart.coupon_code is the actual entered/generated coupon. The
        // latter is what the DELETE endpoint resolves for removal.
        code: cart.couponCode ?? discount.code,
        id: discount.id,
        kind: 'discount' as const,
        label: discount.code || discount.name,
      },
    ]
  })

  return cart.appliedGiftCard
    ? [
        ...discounts,
        {
          amount: formatMoney(cart.appliedGiftCard.appliedAmount, locale),
          code: cart.appliedGiftCard.code,
          id: cart.appliedGiftCard.id,
          kind: 'gift-card' as const,
          label: cart.appliedGiftCard.code,
        },
      ]
    : discounts
}
