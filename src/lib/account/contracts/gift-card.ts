export type CustomerGiftCard = {
  active: boolean
  amount: string | null
  amountAuthorized: string | null
  amountRemaining: string | null
  amountUsed: string | null
  code: string
  currency: string
  displayAmount: string | null
  displayAmountRemaining: string | null
  displayAmountUsed: string | null
  expired: boolean
  expiresAt: string | null
  id: string
  redeemedAt: string | null
  status: string
}

const ACTIVE_CUSTOMER_GIFT_CARD_STATUSES = new Set(['active', 'partially_used'])

export type CustomerGiftCardGroups = {
  active: CustomerGiftCard[]
  archived: CustomerGiftCard[]
}

export function partitionCustomerGiftCards(
  cards: readonly CustomerGiftCard[],
): CustomerGiftCardGroups {
  return cards.reduce<CustomerGiftCardGroups>(
    (groups, card) => {
      const group = ACTIVE_CUSTOMER_GIFT_CARD_STATUSES.has(card.status)
        ? groups.active
        : groups.archived

      group.push(card)
      return groups
    },
    { active: [], archived: [] },
  )
}
