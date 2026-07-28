import type { GiftCard } from '@spree/sdk'

import type { CustomerGiftCard } from '@/lib/account/model/customer-gift-card'

export function mapSpreeGiftCardToCustomerGiftCard(
  card: GiftCard,
): CustomerGiftCard {
  return {
    active: card.active,
    amount: card.amount,
    amountAuthorized: card.amount_authorized,
    amountRemaining: card.amount_remaining,
    amountUsed: card.amount_used,
    code: card.code,
    currency: card.currency,
    displayAmount: card.display_amount,
    displayAmountRemaining: card.display_amount_remaining,
    displayAmountUsed: card.display_amount_used,
    expired: card.expired,
    expiresAt: card.expires_at,
    id: card.id,
    redeemedAt: card.redeemed_at,
    status: card.status,
  }
}

export function mapSpreeGiftCardsToCustomerGiftCards(
  cards: Array<GiftCard>,
): Array<CustomerGiftCard> {
  return cards.map(mapSpreeGiftCardToCustomerGiftCard)
}
