import { partitionCustomerGiftCards } from '@/lib/account/contracts'
import type { CustomerGiftCard } from '@/lib/account/contracts'
import type {
  AccountGiftCardDisplayLabels,
  AccountGiftCardGroups,
  AccountGiftCardModel,
} from '@/components/contracts/account'
import { formatDate } from '@/components/shared/locale-format'
import { formatStatusLabel } from '@/components/shared/status-label'

function getAccountGiftCardDisplay({
  card,
  labels,
  locale,
}: {
  card: CustomerGiftCard
  labels: AccountGiftCardDisplayLabels
  locale: string
}): AccountGiftCardModel {
  const detailLines = [
    `${labels.totalAmount} ${card.displayAmount ?? '—'}`,
    `${labels.usedAmount} ${card.displayAmountUsed ?? '—'}`,
    card.expiresAt
      ? `${labels.expiresOn} ${formatDate(card.expiresAt, locale)}`
      : labels.noExpiration,
  ]

  if (card.redeemedAt) {
    detailLines.push(
      `${labels.redeemedOn} ${formatDate(card.redeemedAt, locale)}`,
    )
  }

  return {
    code: card.code,
    detailLines,
    displayAmountRemaining: card.displayAmountRemaining ?? undefined,
    id: card.id,
    remainingLabel: labels.remaining,
    statusLabel: formatStatusLabel(card.status),
  }
}

export function getAccountGiftCardDisplayGroups({
  cards,
  labels,
  locale,
}: {
  cards: readonly CustomerGiftCard[]
  labels: AccountGiftCardDisplayLabels
  locale: string
}): AccountGiftCardGroups {
  const groups = partitionCustomerGiftCards(cards)

  return {
    active: groups.active.map((card) =>
      getAccountGiftCardDisplay({ card, labels, locale }),
    ),
    archived: groups.archived.map((card) =>
      getAccountGiftCardDisplay({ card, labels, locale }),
    ),
  }
}
