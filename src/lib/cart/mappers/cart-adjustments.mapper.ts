import type { Cart as SpreeCart, Order as SpreeOrder } from '@spree/sdk'

import type {
  CartAppliedDiscount,
  CartAppliedGiftCard,
} from '@/lib/cart/contracts'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'

type SpreeCartOrOrder = SpreeCart | SpreeOrder

export function mapSpreeAppliedDiscount(
  discount: SpreeCart['discounts'][number],
  currencyCode: string,
): CartAppliedDiscount {
  return {
    id: discount.id,
    promotionId: discount.promotion_id,
    name: discount.name,
    description: discount.description,
    code: discount.code,
    amount: mapSpreeAmountToMoney(discount.amount, currencyCode),
  }
}

export function mapSpreeAppliedGiftCard(
  cart: SpreeCartOrOrder,
): CartAppliedGiftCard | null {
  const giftCard = cart.gift_card

  if (!giftCard) {
    return null
  }

  const appliedAmount = mapSpreeAmountToMoney(
    cart.gift_card_total,
    cart.currency,
  )

  return {
    id: giftCard.id,
    code: giftCard.code,
    status: giftCard.status,
    appliedAmount: appliedAmount
      ? {
          amount: -Math.abs(appliedAmount.amount),
          currencyCode: appliedAmount.currencyCode,
        }
      : null,
    amountRemaining: mapSpreeAmountToMoney(
      giftCard.amount_remaining,
      giftCard.currency,
    ),
    expiresAt: giftCard.expires_at,
    expired: giftCard.expired,
    active: giftCard.active,
  }
}
