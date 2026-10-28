import { Check, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AccountAddressCardModel } from '@/components/contracts/account'
import { AccountPill, AccountSurface } from './account-ui-view'

export type {
  AccountAddressCardLabels,
  AccountAddressCardModel,
} from '@/components/contracts/account'

export function AccountAddressCardView({
  model,
  onDelete,
  onEdit,
}: {
  model: AccountAddressCardModel
  onDelete: () => void
  onEdit: () => void
}) {
  const { address, isDeleting, labels } = model

  return (
    <AccountSurface>
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xs font-normal text-foreground">
            {address.fullName}
          </h2>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              onClick={onEdit}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
              {labels.edit}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={onDelete}
              size="sm"
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              {isDeleting ? labels.removing : labels.remove}
            </Button>
          </div>
        </div>

        {(address.isDefaultShipping || address.isDefaultBilling) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {address.isDefaultShipping && (
              <AccountPill className="gap-1.5 whitespace-nowrap rounded-full border-foreground/15 bg-muted px-3 py-1.5 text-xs leading-none tracking-[0.08em] text-foreground">
                <Check aria-hidden="true" className="h-3 w-3" />
                {labels.defaultShipping}
              </AccountPill>
            )}
            {address.isDefaultBilling && (
              <AccountPill className="gap-1.5 whitespace-nowrap rounded-full border-foreground/15 bg-muted px-3 py-1.5 text-xs leading-none tracking-[0.08em] text-foreground">
                <Check aria-hidden="true" className="h-3 w-3" />
                {labels.defaultBilling}
              </AccountPill>
            )}
          </div>
        )}

        {address.lines.length ? (
          <div className="mt-5 space-y-1.5 text-xs leading-6 text-muted-foreground">
            {address.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            {labels.notProvided}
          </p>
        )}
      </div>
    </AccountSurface>
  )
}
