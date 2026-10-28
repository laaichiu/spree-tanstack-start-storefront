import { CreditCard, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AccountPaymentMethodCardModel } from '@/components/contracts/account'
import { AccountPill, AccountSurface } from './account-ui-view'

export type {
  AccountPaymentMethodCardLabels,
  AccountPaymentMethodCardModel,
} from '@/components/contracts/account'

export function AccountPaymentMethodCardView({
  model,
  onDelete,
}: {
  model: AccountPaymentMethodCardModel
  onDelete: () => void
}) {
  const { card, isPending, labels } = model

  return (
    <AccountSurface>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0 text-muted-foreground">
            <CreditCard aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-normal text-foreground">
                {card.brandLabel} {labels.cardEndingIn} {card.last4}
              </h2>
              {card.default && (
                <AccountPill>{labels.defaultPaymentMethod}</AccountPill>
              )}
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {labels.cardExpires} {card.expiryLabel}
            </p>
            {card.name && (
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {card.name}
              </p>
            )}
          </div>
        </div>

        <Button
          disabled={isPending}
          onClick={onDelete}
          size="sm"
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          {isPending ? labels.removing : labels.remove}
        </Button>
      </div>
    </AccountSurface>
  )
}
