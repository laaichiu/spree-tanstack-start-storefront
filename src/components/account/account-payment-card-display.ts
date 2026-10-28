import type { CustomerCreditCard } from '@/lib/account/contracts'
import {
  formatCustomerCreditCardBrand,
  formatCustomerCreditCardExpiry,
} from '@/components/shared/customer-credit-card-display'

export type CustomerAccountPaymentCardDisplay = {
  brandLabel: string
  default: boolean
  expiryLabel: string
  id: string
  last4: string
  name?: string
}

export function getCustomerAccountPaymentCardDisplays(
  cards: readonly CustomerCreditCard[],
): CustomerAccountPaymentCardDisplay[] {
  return cards.map((card) => ({
    brandLabel: formatCustomerCreditCardBrand(card.brand, 'CARD'),
    default: card.default,
    expiryLabel: formatCustomerCreditCardExpiry(card),
    id: card.id,
    last4: card.last4,
    name: card.name ?? undefined,
  }))
}
