import {
  AddressFormDialog,
  DeleteAddressDialog,
} from '@/components/account/account-address-dialogs'
import { getCustomerAddressDisplay } from '@/components/account/account-address-display'
import { AccountAddressesSectionView } from '@/components/account/account-addresses-section-view'
import type { CustomerAddress } from '@/lib/account/contracts'
import { useRouter } from '@tanstack/react-router'
import { useMarket } from '@/components/layout/market-provider'
import { useCustomerAddressController } from '@/lib/account/client/use-customer-address-controller'

export function AccountAddressesList({
  addresses,
  loadError,
}: {
  addresses: Array<CustomerAddress>
  loadError?: boolean
}) {
  const router = useRouter()
  const { market, t } = useMarket()
  const {
    actions,
    addressDialog,
    deleteDialog,
    errorMessage,
    pendingDeleteAddressId,
  } = useCustomerAddressController({
    addresses,
    deleteErrorMessage: t('account.addressDeleteFailed'),
    fallbackCountry: market.country,
    market: { country: market.country, locale: market.locale },
    onChanged: () => router.invalidate(),
    saveErrorMessage: t('account.addressSaveFailed'),
  })

  const cardLabels = {
    defaultBilling: t('account.defaultBilling'),
    defaultShipping: t('account.defaultShipping'),
    edit: t('account.editAddress'),
    notProvided: t('account.notProvided'),
    remove: t('account.removeAddress'),
    removing: t('account.removingAddress'),
  }
  const labels = {
    addAddress: t('account.addAddress'),
    addresses: t('account.addresses'),
    addressesDescription: t('account.addressesDescription'),
    addressesLoadFailed: t('account.addressesLoadFailed'),
    addressesLoadFailedDescription: t('account.addressesLoadFailedDescription'),
    noAddresses: t('account.noAddresses'),
    noAddressesDescription: t('account.noAddressesDescription'),
  }
  return (
    <AccountAddressesSectionView
      model={
        loadError
          ? { labels, status: 'load-error' }
          : {
              addresses: addresses.map((address) => ({
                address: getCustomerAddressDisplay(address),
                isDeleting: address.id === pendingDeleteAddressId,
                labels: cardLabels,
              })),
              errorMessage: errorMessage ?? undefined,
              labels,
              status: 'ready',
            }
      }
      onAdd={actions.add}
      onDelete={actions.delete}
      onEdit={actions.edit}
      dialogs={
        <>
          <AddressFormDialog {...addressDialog} />
          <DeleteAddressDialog {...deleteDialog} />
        </>
      }
    />
  )
}
