import { useRouter } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { getCustomerAccountPaymentCardDisplays } from '@/components/account/account-payment-card-display'
import type { CustomerCreditCard } from '@/lib/account/contracts'
import { AccountPaymentMethodsSectionView } from '@/components/account/account-payment-methods-section-view'
import { useCustomerCreditCardDeletionController } from '@/lib/account/client/use-customer-credit-card-deletion-controller'

export function AccountPaymentMethodsList({
  cards,
  loadError,
}: {
  cards: Array<CustomerCreditCard>
  loadError?: boolean
}) {
  const router = useRouter()
  const { market, t } = useMarket()
  const {
    deleteCard,
    error: errorMessage,
    isPendingForCard,
  } = useCustomerCreditCardDeletionController({
    errorMessage: t('account.paymentMethodRemoveFailed'),
    market: { country: market.country, locale: market.locale },
    onDeleted: () => router.invalidate(),
  })

  const labels = {
    noPaymentMethods: t('account.noPaymentMethods'),
    noPaymentMethodsDescription: t('account.noPaymentMethodsDescription'),
    paymentMethods: t('account.paymentMethods'),
    paymentMethodsDescription: t('account.paymentMethodsDescription'),
    paymentMethodsLoadFailed: t('account.paymentMethodsLoadFailed'),
    paymentMethodsLoadFailedDescription: t(
      'account.paymentMethodsLoadFailedDescription',
    ),
    securePaymentMethodsDescription: t(
      'account.securePaymentMethodsDescription',
    ),
  }

  return (
    <AccountPaymentMethodsSectionView
      model={
        loadError
          ? { labels, status: 'load-error' }
          : {
              cards: getCustomerAccountPaymentCardDisplays(cards).map(
                (card) => ({
                  card,
                  isPending: isPendingForCard(card.id),
                  labels: {
                    cardEndingIn: t('account.cardEndingIn'),
                    cardExpires: t('account.cardExpires'),
                    defaultPaymentMethod: t('account.defaultPaymentMethod'),
                    remove: t('account.removePaymentMethod'),
                    removing: t('account.removingPaymentMethod'),
                  },
                }),
              ),
              errorMessage: errorMessage ?? undefined,
              labels,
              status: 'ready',
            }
      }
      onDelete={deleteCard}
    />
  )
}
