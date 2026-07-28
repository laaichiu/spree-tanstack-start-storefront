import { CircleAlert, Gift, Info } from 'lucide-react'

import {
  AccountEmptyState,
  AccountMessage,
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import type { CustomerGiftCard } from '@/lib/account/model/customer-gift-card'
import { formatDate } from '@/lib/i18n/messages'
import { formatStatusLabel } from '@/lib/i18n/format-status-label'

const ACTIVE_GIFT_CARD_STATUSES = new Set(['active', 'partially_used'])

function GiftCardSurface({ card }: { card: CustomerGiftCard }) {
  const { market, t } = useMarket()
  const details = [
    `${t('account.giftCardTotalAmount')} ${card.displayAmount}`,
    `${t('account.giftCardUsedAmount')} ${card.displayAmountUsed}`,
    card.expiresAt
      ? `${t('account.giftCardExpiresOn')} ${formatDate(
          card.expiresAt,
          market.locale,
        )}`
      : t('account.giftCardNoExpiration'),
    card.redeemedAt
      ? `${t('account.giftCardRedeemedOn')} ${formatDate(
          card.redeemedAt,
          market.locale,
        )}`
      : null,
  ].filter(Boolean)

  return (
    <AccountSurface>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-normal text-foreground">{card.code}</p>
            <AccountPill>{formatStatusLabel(card.status)}</AccountPill>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          <p className="text-xl font-normal text-foreground">
            {card.displayAmountRemaining}
          </p>
          <p className="mt-1 text-sm tracking-wider text-muted-foreground uppercase">
            {t('account.giftCardRemaining')}
          </p>
        </div>
      </div>
    </AccountSurface>
  )
}

function GiftCardGroup({
  cards,
  label,
}: {
  cards: Array<CustomerGiftCard>
  label: string
}) {
  if (!cards.length) {
    return null
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm tracking-wider text-muted-foreground uppercase">
        {label} ({cards.length})
      </h2>
      <div className="space-y-4">
        {cards.map((card) => (
          <GiftCardSurface card={card} key={card.id} />
        ))}
      </div>
    </section>
  )
}

export function AccountGiftCardsList({
  cards,
  loadError,
}: {
  cards: Array<CustomerGiftCard>
  loadError?: boolean
}) {
  const { t } = useMarket()
  const activeCards = cards.filter((card) =>
    ACTIVE_GIFT_CARD_STATUSES.has(card.status),
  )
  const archivedCards = cards.filter(
    (card) => !ACTIVE_GIFT_CARD_STATUSES.has(card.status),
  )

  if (loadError) {
    return (
      <AccountEmptyState
        description={t('account.giftCardsLoadFailedDescription')}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={t('account.giftCardsLoadFailed')}
      />
    )
  }

  if (!cards.length) {
    return (
      <div className="space-y-6">
        <AccountEmptyState
          description={t('account.noGiftCardsDescription')}
          icon={<Gift aria-hidden="true" className="h-5 w-5" />}
          title={t('account.noGiftCards')}
        />
        <AccountMessage>
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('account.giftCardsDescription')}</p>
        </AccountMessage>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AccountSurface>
        <AccountSectionHeader
          description={t('account.giftCardsDescription')}
          title={t('account.giftCards')}
        />
      </AccountSurface>

      <GiftCardGroup cards={activeCards} label={t('account.activeGiftCards')} />
      <GiftCardGroup
        cards={archivedCards}
        label={t('account.archivedGiftCards')}
      />
    </div>
  )
}
