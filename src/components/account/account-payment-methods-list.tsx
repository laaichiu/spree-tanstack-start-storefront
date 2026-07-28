import { useRouter } from '@tanstack/react-router'
import { CircleAlert, CreditCard, Lock, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { deleteCustomerCreditCard } from '@/lib/account/api/customer-credit-card.functions'
import {
  AccountEmptyState,
  AccountMessage,
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import {
  formatCustomerCreditCardBrand,
  formatCustomerCreditCardExpiry,
} from '@/lib/account/model/customer-credit-card'

function PaymentMethodCard({
  card,
  isPending,
  onDelete,
}: {
  card: CustomerCreditCard
  isPending: boolean
  onDelete: (cardId: string) => void
}) {
  const { t } = useMarket()

  return (
    <AccountSurface>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0 text-muted-foreground">
            <CreditCard aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-normal text-foreground">
                {formatCustomerCreditCardBrand(card.brand)}{' '}
                {t('account.cardEndingIn')} {card.last4}
              </h2>
              {card.default ? (
                <AccountPill>{t('account.defaultPaymentMethod')}</AccountPill>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('account.cardExpires')} {formatCustomerCreditCardExpiry(card)}
            </p>
            {card.name ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {card.name}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          disabled={isPending}
          onClick={() => onDelete(card.id)}
          size="sm"
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          {isPending
            ? t('account.removingPaymentMethod')
            : t('account.removePaymentMethod')}
        </Button>
      </div>
    </AccountSurface>
  )
}

export function AccountPaymentMethodsList({
  cards,
  loadError,
}: {
  cards: Array<CustomerCreditCard>
  loadError?: boolean
}) {
  const router = useRouter()
  const { t } = useMarket()
  const [pendingCardId, setPendingCardId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleDeleteCard(cardId: string) {
    setPendingCardId(cardId)
    setErrorMessage(null)

    try {
      await deleteCustomerCreditCard({
        data: {
          id: cardId,
        },
      })
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('account.paymentMethodRemoveFailed'),
      )
    } finally {
      setPendingCardId(null)
    }
  }

  if (loadError) {
    return (
      <AccountEmptyState
        description={t('account.paymentMethodsLoadFailedDescription')}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={t('account.paymentMethodsLoadFailed')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <AccountSurface>
        <AccountSectionHeader
          description={t('account.paymentMethodsDescription')}
          title={t('account.paymentMethods')}
        />
      </AccountSurface>

      {errorMessage ? (
        <AccountMessage tone="error">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </AccountMessage>
      ) : null}

      {cards.length ? (
        <div className="space-y-4">
          {cards.map((card) => (
            <PaymentMethodCard
              card={card}
              isPending={pendingCardId === card.id}
              key={card.id}
              onDelete={(cardId) => void handleDeleteCard(cardId)}
            />
          ))}
        </div>
      ) : (
        <AccountEmptyState
          description={t('account.noPaymentMethodsDescription')}
          icon={<CreditCard aria-hidden="true" className="h-5 w-5" />}
          title={t('account.noPaymentMethods')}
        />
      )}

      <AccountMessage>
        <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('account.securePaymentMethodsDescription')}</p>
      </AccountMessage>
    </div>
  )
}
