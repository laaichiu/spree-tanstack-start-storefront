import type { CustomerCreditCard } from '../../account/contracts'

export type CheckoutSavedPaymentCard = CustomerCreditCard & {
  gatewayPaymentProfileId: string
}

export function getCheckoutSavedPaymentCards(
  cards: readonly CustomerCreditCard[],
): CheckoutSavedPaymentCard[] {
  return cards.filter((card): card is CheckoutSavedPaymentCard =>
    Boolean(card.gatewayPaymentProfileId?.trim()),
  )
}

export function getDefaultCheckoutSavedPaymentCard(
  cards: readonly CustomerCreditCard[],
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
  cards: readonly CheckoutSavedPaymentCard[]
  paymentProfileId: string | null
}) {
  if (!paymentProfileId) {
    return false
  }

  return cards.some((card) => card.gatewayPaymentProfileId === paymentProfileId)
}
