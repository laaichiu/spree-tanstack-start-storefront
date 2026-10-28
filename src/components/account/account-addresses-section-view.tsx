import { CircleAlert, MapPin, Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { AccountAddressesSectionModel } from '@/components/contracts/account'
import { AccountAddressCardView } from './account-address-card-view'
import {
  AccountEmptyState,
  AccountMessage,
  AccountSectionHeader,
  AccountSurface,
} from './account-ui-view'

export type { AccountAddressesSectionModel } from '@/components/contracts/account'

export function AccountAddressesSectionView({
  model,
  onAdd,
  onDelete,
  onEdit,
  dialogs,
}: {
  model: AccountAddressesSectionModel
  onAdd: () => void
  onDelete: (addressId: string) => void
  onEdit: (addressId: string) => void
  dialogs: ReactNode
}) {
  const { labels } = model
  const addAction = (
    <Button onClick={onAdd} type="button">
      <Plus aria-hidden="true" className="h-4 w-4" />
      {labels.addAddress}
    </Button>
  )

  if (model.status === 'load-error') {
    return (
      <AccountEmptyState
        description={labels.addressesLoadFailedDescription}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={labels.addressesLoadFailed}
      />
    )
  }

  return (
    <div className="space-y-6">
      {model.addresses.length > 0 && (
        <AccountSurface>
          <AccountSectionHeader
            action={addAction}
            description={labels.addressesDescription}
            title={labels.addresses}
          />
        </AccountSurface>
      )}

      {model.errorMessage && (
        <AccountMessage tone="error">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{model.errorMessage}</p>
        </AccountMessage>
      )}

      {model.addresses.length === 0 ? (
        <AccountEmptyState
          action={addAction}
          description={labels.noAddressesDescription}
          icon={<MapPin aria-hidden="true" className="h-5 w-5" />}
          title={labels.noAddresses}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {model.addresses.map((address) => (
            <AccountAddressCardView
              key={address.address.id}
              model={address}
              onDelete={() => onDelete(address.address.id)}
              onEdit={() => onEdit(address.address.id)}
            />
          ))}
        </div>
      )}
      {dialogs}
    </div>
  )
}
