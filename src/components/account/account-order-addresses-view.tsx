import { AccountSectionHeader, AccountSurface } from './account-ui-view'

import type {
  AccountOrderAddress,
  AccountOrderAddressesModel,
} from '@/components/contracts/account'

export type {
  AccountOrderAddress,
  AccountOrderAddressesModel,
} from '@/components/contracts/account'

export function AccountOrderAddressesView({
  model,
}: {
  model: AccountOrderAddressesModel
}) {
  const { labels } = model

  if (!model.shippingAddress && !model.billingAddress) {
    return null
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {model.shippingAddress && (
        <OrderAddressCard
          address={model.shippingAddress}
          title={labels.shipping}
        />
      )}
      {model.billingAddress && (
        <OrderAddressCard
          address={model.billingAddress}
          title={labels.billing}
        />
      )}
    </div>
  )
}

function OrderAddressCard({
  address,
  title,
}: {
  address: AccountOrderAddress
  title: string
}) {
  return (
    <AccountSurface>
      <AccountSectionHeader title={title} />
      <div className="mt-6">
        <div className="space-y-1.5 text-xs leading-6 text-muted-foreground">
          <p className="font-normal text-foreground">{address.fullName}</p>
          {address.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </AccountSurface>
  )
}
