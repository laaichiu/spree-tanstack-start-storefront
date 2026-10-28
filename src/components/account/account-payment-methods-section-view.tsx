import { CircleAlert, CreditCard, Lock } from 'lucide-react'

import {
  AccountEmptyState,
  AccountMessage,
  AccountSectionHeader,
  AccountSurface,
} from './account-ui-view'
import { AccountPaymentMethodCardView } from './account-payment-method-card-view'
import type { AccountPaymentMethodsSectionModel } from '@/components/contracts/account'

export type {
  AccountPaymentMethodsSectionLabels,
  AccountPaymentMethodsSectionModel,
} from '@/components/contracts/account'

export function AccountPaymentMethodsSectionView({
  model,
  onDelete,
}: {
  model: AccountPaymentMethodsSectionModel
  onDelete: (cardId: string) => void
}) {
  const { labels } = model

  if (model.status === 'load-error') {
    return (
      <AccountEmptyState
        description={labels.paymentMethodsLoadFailedDescription}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={labels.paymentMethodsLoadFailed}
      />
    )
  }

  return (
    <div className="space-y-6">
      <AccountSurface>
        <AccountSectionHeader
          description={labels.paymentMethodsDescription}
          title={labels.paymentMethods}
        />
      </AccountSurface>

      {model.errorMessage && (
        <AccountMessage tone="error">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{model.errorMessage}</p>
        </AccountMessage>
      )}

      {model.cards.length ? (
        <div className="space-y-4">
          {model.cards.map((card) => (
            <AccountPaymentMethodCardView
              key={card.card.id}
              model={card}
              onDelete={() => onDelete(card.card.id)}
            />
          ))}
        </div>
      ) : (
        <AccountEmptyState
          description={labels.noPaymentMethodsDescription}
          icon={<CreditCard aria-hidden="true" className="h-5 w-5" />}
          title={labels.noPaymentMethods}
        />
      )}

      <AccountMessage>
        <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{labels.securePaymentMethodsDescription}</p>
      </AccountMessage>
    </div>
  )
}
