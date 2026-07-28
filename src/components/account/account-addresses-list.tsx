import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { CircleAlert, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'

import { CustomerAddressCard } from '@/components/account/account-address-card'
import {
  AddressFormDialog,
  DeleteAddressDialog,
} from '@/components/account/account-address-dialogs'
import { Button } from '@/components/ui/button'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from '@/lib/account/api/customer-address.functions'
import {
  AccountEmptyState,
  AccountMessage,
  AccountSectionHeader,
  AccountSurface,
} from '@/components/account/account-ui'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { useMarket } from '@/components/layout/market-provider'

export function AccountAddressesList({
  addresses,
  loadError,
}: {
  addresses: Array<CustomerAddress>
  loadError?: boolean
}) {
  const router = useRouter()
  const { market, t } = useMarket()
  const [isAddressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<CustomerAddress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const addressMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id?: string
      values: CustomerAddressInput
    }) =>
      id
        ? updateCustomerAddress({
            data: {
              address: values,
              id,
            },
          })
        : createCustomerAddress({
            data: values,
          }),
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : t('account.addressSaveFailed'),
      )
    },
    onSuccess: async () => {
      setAddressDialogOpen(false)
      setEditingAddress(null)
      setErrorMessage(null)
      await router.invalidate()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (addressId: string) =>
      deleteCustomerAddress({
        data: {
          id: addressId,
        },
      }),
    onError: (error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('account.addressDeleteFailed'),
      )
    },
    onSuccess: async () => {
      setDeleteTarget(null)
      setErrorMessage(null)
      await router.invalidate()
    },
  })

  function openAddressDialog(address: CustomerAddress | null) {
    setEditingAddress(address)
    setErrorMessage(null)
    addressMutation.reset()
    setAddressDialogOpen(true)
  }

  if (loadError) {
    return (
      <AccountEmptyState
        description={t('account.addressesLoadFailedDescription')}
        icon={<CircleAlert aria-hidden="true" className="h-5 w-5" />}
        title={t('account.addressesLoadFailed')}
      />
    )
  }

  const dialogs = (
    <>
      <AddressFormDialog
        address={editingAddress}
        fallbackCountry={market.country}
        isPending={addressMutation.isPending}
        onOpenChange={setAddressDialogOpen}
        onSubmit={(values) =>
          addressMutation.mutate({
            id: editingAddress?.id,
            values,
          })
        }
        open={isAddressDialogOpen}
      />
      <DeleteAddressDialog
        address={deleteTarget}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      />
    </>
  )

  if (!addresses.length) {
    return (
      <div className="space-y-6">
        {errorMessage ? (
          <AccountMessage tone="error">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <p>{errorMessage}</p>
          </AccountMessage>
        ) : null}
        <AccountEmptyState
          action={
            <Button onClick={() => openAddressDialog(null)} type="button">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t('account.addAddress')}
            </Button>
          }
          description={t('account.noAddressesDescription')}
          icon={<MapPin aria-hidden="true" className="h-5 w-5" />}
          title={t('account.noAddresses')}
        />
        {dialogs}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AccountSurface>
        <AccountSectionHeader
          action={
            <Button onClick={() => openAddressDialog(null)} type="button">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t('account.addAddress')}
            </Button>
          }
          description={t('account.addressesDescription')}
          title={t('account.addresses')}
        />
      </AccountSurface>

      {errorMessage ? (
        <AccountMessage tone="error">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </AccountMessage>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {addresses.map((address) => (
          <CustomerAddressCard
            address={address}
            isDeleting={deleteMutation.isPending && deleteTarget === address}
            key={address.id}
            onDelete={() => {
              setErrorMessage(null)
              setDeleteTarget(address)
            }}
            onEdit={() => openAddressDialog(address)}
          />
        ))}
      </div>

      {dialogs}
    </div>
  )
}
