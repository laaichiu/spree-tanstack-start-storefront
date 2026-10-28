import { AddressFormFields } from '@/components/account/account-address-form-fields'
import { getCustomerAddressDisplay } from '@/components/account/account-address-display'
import { useMarket } from '@/components/layout/market-provider'
import type { CustomerAddress } from '@/lib/account/contracts'
import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { AccountAddressFormDialogView } from '@/components/account/account-address-form-dialog-view'
import { AccountDeleteAddressDialogView } from '@/components/account/account-delete-address-dialog-view'
import { useAccountAddressFormController } from './use-account-address-form-controller'

export function AddressFormDialog({
  address,
  fallbackCountry,
  isPending,
  onOpenChange,
  onSubmit,
  open,
}: {
  address: CustomerAddress | null
  fallbackCountry: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CustomerAddressInput) => void
  open: boolean
}) {
  const { t } = useMarket()
  const { control, errors, register, setValue, submit } =
    useAccountAddressFormController({
      address,
      fallbackCountry,
      onSubmit,
    })

  return (
    <AccountAddressFormDialogView
      model={{
        cancelLabel: t('account.cancel'),
        closeLabel: t('account.cancel'),
        description: t('account.addressFormDescription'),
        isPending,
        open,
        saveLabel: t('account.saveAddress'),
        savingLabel: t('account.savingAddress'),
        title: address ? t('account.editAddress') : t('account.addAddress'),
      }}
      onOpenChange={onOpenChange}
      onSubmit={submit}
    >
      <AddressFormFields
        control={control}
        errors={errors}
        isPending={isPending}
        open={open}
        register={register}
        setValue={setValue}
      />
    </AccountAddressFormDialogView>
  )
}

export function DeleteAddressDialog({
  address,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  address: CustomerAddress | null
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useMarket()

  return (
    <AccountDeleteAddressDialogView
      model={{
        address: address ? getCustomerAddressDisplay(address) : null,
        cancelLabel: t('account.cancel'),
        closeLabel: t('account.cancel'),
        confirmLabel: t('account.deleteAddress'),
        description: t('account.deleteAddressDescription'),
        isPending,
        removingLabel: t('account.removingAddress'),
        title: t('account.deleteAddressTitle'),
      }}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  )
}
