import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'

export type CheckoutSavedPaymentCard = CustomerCreditCard & {
  gatewayPaymentProfileId: string
}

export function getCheckoutSavedPaymentCards(
  cards: Array<CustomerCreditCard>,
): Array<CheckoutSavedPaymentCard> {
  return cards.filter((card): card is CheckoutSavedPaymentCard =>
    Boolean(card.gatewayPaymentProfileId?.trim()),
  )
}

export function getDefaultCheckoutSavedPaymentCard(
  cards: Array<CustomerCreditCard>,
): CheckoutSavedPaymentCard | null {
  const checkoutCards = getCheckoutSavedPaymentCards(cards)

  return (
    checkoutCards.find((card) => card.default) ?? checkoutCards.at(0) ?? null
  )
}

export function isCheckoutSavedPaymentProfileAvailable({
  cards,
  paymentProfileId,
}: {
  cards: Array<CheckoutSavedPaymentCard>
  paymentProfileId: string | null
}) {
  if (!paymentProfileId) {
    return false
  }

  return cards.some((card) => card.gatewayPaymentProfileId === paymentProfileId)
}
