import { Check, Pencil, Trash2 } from 'lucide-react'

import { AccountPill, AccountSurface } from '@/components/account/account-ui'
import { Button } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import { getAddressLines } from '@/lib/account/model/customer-address'

export function CustomerAddressCard({
  address,
  isDeleting,
  onDelete,
  onEdit,
}: {
  address: CustomerAddress
  isDeleting: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const { t } = useMarket()
  const lines = getAddressLines(address)

  return (
    <AccountSurface>
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-normal text-foreground">
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
              {t('account.editAddress')}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={onDelete}
              size="sm"
              type="button"
              variant="danger"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              {isDeleting
                ? t('account.removingAddress')
                : t('account.removeAddress')}
            </Button>
          </div>
        </div>

        {address.isDefaultShipping || address.isDefaultBilling ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {address.isDefaultShipping ? (
              <AccountPill className="gap-1.5 whitespace-nowrap rounded-full border-foreground/15 bg-muted px-3 py-1.5 text-xs leading-none tracking-[0.08em] text-foreground">
                <Check aria-hidden="true" className="h-3 w-3" />
                {t('account.defaultShipping')}
              </AccountPill>
            ) : null}
            {address.isDefaultBilling ? (
              <AccountPill className="gap-1.5 whitespace-nowrap rounded-full border-foreground/15 bg-muted px-3 py-1.5 text-xs leading-none tracking-[0.08em] text-foreground">
                <Check aria-hidden="true" className="h-3 w-3" />
                {t('account.defaultBilling')}
              </AccountPill>
            ) : null}
          </div>
        ) : null}

        {lines.length ? (
          <div className="mt-5 space-y-1.5 text-sm leading-6 text-muted-foreground">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {t('account.notProvided')}
          </p>
        )}
      </div>
    </AccountSurface>
  )
}
