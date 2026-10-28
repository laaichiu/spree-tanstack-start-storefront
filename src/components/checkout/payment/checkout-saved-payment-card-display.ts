import type { CustomerCreditCard } from '@/lib/account/contracts'
import { getCheckoutSavedPaymentCards } from '@/lib/checkout/contracts'
import {
  formatCustomerCreditCardBrand,
  formatCustomerCreditCardExpiry,
} from '@/components/shared/customer-credit-card-display'

export type CheckoutSavedPaymentCardOptionDisplay = {
  description: string
  isDefault: boolean
  label: string
  value: string
}

export function getCheckoutSavedPaymentCardOptionDisplays({
  cardEndingIn,
  cardExpires,
  cards,
}: {
  cardEndingIn: string
  cardExpires: string
  cards: readonly CustomerCreditCard[]
}): CheckoutSavedPaymentCardOptionDisplay[] {
  return getCheckoutSavedPaymentCards(cards).map((card) => ({
    description: `${cardExpires} ${formatCustomerCreditCardExpiry(card)}`,
    isDefault: card.default,
    label: `${formatCustomerCreditCardBrand(card.brand, 'CARD')} ${cardEndingIn} ${card.last4}`,
    value: card.gatewayPaymentProfileId,
  }))
}
