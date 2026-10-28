import { formatSpreeMoney } from '@/lib/runtime/spree-money'
import type { GiftCard } from '@spree/sdk'

import type { CustomerGiftCard } from '@/lib/account/contracts'

export function mapSpreeGiftCardToCustomerGiftCard(
  card: GiftCard,
  locale: string,
): CustomerGiftCard {
  return {
    active: card.active,
    amount: card.amount,
    amountAuthorized: card.amount_authorized,
    amountRemaining: card.amount_remaining,
    amountUsed: card.amount_used,
    code: card.code,
    currency: card.currency,
    displayAmount: formatSpreeMoney(card.amount, {
      currencyCode: card.currency,
      locale,
    }),
    displayAmountRemaining: formatSpreeMoney(card.amount_remaining, {
      currencyCode: card.currency,
      locale,
    }),
    displayAmountUsed: formatSpreeMoney(card.amount_used, {
      currencyCode: card.currency,
      locale,
    }),
    expired: card.expired,
    expiresAt: card.expires_at,
    id: card.id,
    redeemedAt: card.redeemed_at,
    status: card.status,
  }
}

export function mapSpreeGiftCardsToCustomerGiftCards(
  cards: Array<GiftCard>,
  locale: string,
): Array<CustomerGiftCard> {
  return cards.map((card) => mapSpreeGiftCardToCustomerGiftCard(card, locale))
}
