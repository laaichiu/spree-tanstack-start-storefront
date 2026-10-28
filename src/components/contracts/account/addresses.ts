import type { AddressDisplay } from '@/lib/core/address'
import type { CustomerAddressDisplay } from '@/components/account/account-address-display'

export type AccountAddressCardLabels = {
  defaultBilling: string
  defaultShipping: string
  edit: string
  notProvided: string
  remove: string
  removing: string
}
export type AccountAddressCardModel = {
  address: CustomerAddressDisplay
  isDeleting: boolean
  labels: AccountAddressCardLabels
}

type AccountAddressesSectionLabels = {
  addAddress: string
  addresses: string
  addressesDescription: string
  addressesLoadFailed: string
  addressesLoadFailedDescription: string
  noAddresses: string
  noAddressesDescription: string
}

export type AccountAddressesSectionModel =
  | {
      labels: AccountAddressesSectionLabels
      status: 'load-error'
    }
  | {
      addresses: readonly AccountAddressCardModel[]
      errorMessage?: string
      labels: AccountAddressesSectionLabels
      status: 'ready'
    }

export type AccountAddressFormDialogModel = {
  cancelLabel: string
  closeLabel: string
  description: string
  isPending: boolean
  open: boolean
  saveLabel: string
  savingLabel: string
  title: string
}

export type AccountDeleteAddressDialogModel = {
  address: AddressDisplay | null
  cancelLabel: string
  closeLabel: string
  confirmLabel: string
  description: string
  isPending: boolean
  removingLabel: string
  title: string
}
