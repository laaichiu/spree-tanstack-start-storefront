import { useMarket } from '@/components/layout/market-provider'
import type { CustomerGiftCard } from '@/lib/account/contracts'
import { getAccountGiftCardDisplayGroups } from './account-gift-card-model'
import { AccountGiftCardsSectionView } from '@/components/account/account-gift-cards-section-view'

export function AccountGiftCardsList({
  cards,
  loadError,
}: {
  cards: Array<CustomerGiftCard>
  loadError?: boolean
}) {
  const { market, t } = useMarket()
  const displayLabels = {
    expiresOn: t('account.giftCardExpiresOn'),
    noExpiration: t('account.giftCardNoExpiration'),
    redeemedOn: t('account.giftCardRedeemedOn'),
    remaining: t('account.giftCardRemaining'),
    totalAmount: t('account.giftCardTotalAmount'),
    usedAmount: t('account.giftCardUsedAmount'),
  }

  const labels = {
    activeGiftCards: t('account.activeGiftCards'),
    archivedGiftCards: t('account.archivedGiftCards'),
    giftCards: t('account.giftCards'),
    giftCardsDescription: t('account.giftCardsDescription'),
    giftCardsLoadFailed: t('account.giftCardsLoadFailed'),
    giftCardsLoadFailedDescription: t('account.giftCardsLoadFailedDescription'),
    noGiftCards: t('account.noGiftCards'),
    noGiftCardsDescription: t('account.noGiftCardsDescription'),
  }

  return (
    <AccountGiftCardsSectionView
      model={
        loadError
          ? { labels, status: 'load-error' }
          : {
              cards: getAccountGiftCardDisplayGroups({
                cards,
                labels: displayLabels,
                locale: market.locale,
              }),
              labels,
              status: 'ready',
            }
      }
    />
  )
}
