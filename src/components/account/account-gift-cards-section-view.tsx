import { CircleAlert, Gift, Info } from 'lucide-react'

import type { AccountGiftCardsSectionModel } from '@/components/contracts/account'
import {
  AccountGiftCardGroupView,
  AccountGiftCardView,
} from './account-gift-card-view'
import {
  AccountEmptyState,
  AccountMessage,
  AccountSectionHeader,
  AccountSurface,
} from './account-ui-view'

export type {
  AccountGiftCardGroups,
  AccountGiftCardsSectionLabels,
  AccountGiftCardsSectionModel,
} from '@/components/contracts/account'

export function AccountGiftCardsSectionView({
  model,
}: {
  model: AccountGiftCardsSectionModel
}) {
  const { labels } = model

  if (model.status === 'load-error') {
    return (
      <AccountEmptyState
        description={labels.giftCardsLoadFailedDescription}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={labels.giftCardsLoadFailed}
      />
    )
  }

  if (model.cards.active.length === 0 && model.cards.archived.length === 0) {
    return (
      <div className="space-y-6">
        <AccountEmptyState
          description={labels.noGiftCardsDescription}
          icon={<Gift aria-hidden="true" className="h-5 w-5" />}
          title={labels.noGiftCards}
        />
        <AccountMessage>
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{labels.giftCardsDescription}</p>
        </AccountMessage>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AccountSurface>
        <AccountSectionHeader
          description={labels.giftCardsDescription}
          title={labels.giftCards}
        />
      </AccountSurface>

      <AccountGiftCardGroupView
        count={model.cards.active.length}
        label={labels.activeGiftCards}
      >
        {model.cards.active.map((card) => (
          <AccountGiftCardView card={card} key={card.id} />
        ))}
      </AccountGiftCardGroupView>
      <AccountGiftCardGroupView
        count={model.cards.archived.length}
        label={labels.archivedGiftCards}
      >
        {model.cards.archived.map((card) => (
          <AccountGiftCardView card={card} key={card.id} />
        ))}
      </AccountGiftCardGroupView>
    </div>
  )
}
