import type { CreditCard } from '@spree/sdk'

import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim() ?? ''

  return normalized || null
}

export function mapSpreeCreditCardToCustomerCreditCard(
  card: CreditCard,
): CustomerCreditCard {
  return {
    brand: card.brand,
    default: card.default,
    expiryMonth: card.month,
    expiryYear: card.year,
    gatewayPaymentProfileId: normalizeNullableText(
      card.gateway_payment_profile_id,
    ),
    id: card.id,
    last4: card.last4,
    name: normalizeNullableText(card.name),
  }
}

export function mapSpreeCreditCardsToCustomerCreditCards(
  cards: Array<CreditCard>,
): Array<CustomerCreditCard> {
  return cards.map(mapSpreeCreditCardToCustomerCreditCard)
}
