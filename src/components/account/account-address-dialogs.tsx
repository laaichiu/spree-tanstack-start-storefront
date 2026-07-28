import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { AddressFormFields } from '@/components/account/account-address-form-fields'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogRoot } from '@/components/ui/dialog'
import { useMarket } from '@/components/layout/market-provider'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import { getAddressLines } from '@/lib/account/model/customer-address'
import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { customerAddressSchema } from '@/lib/account/validation/address'

function getAddressFormValues({
  address,
  fallbackCountry,
}: {
  address: CustomerAddress | null
  fallbackCountry: string
}): CustomerAddressInput {
  return {
    address1: address?.address1 ?? '',
    address2: address?.address2 ?? '',
    city: address?.city ?? '',
    company: address?.company ?? '',
    countryIso: address?.countryIso ?? fallbackCountry.toUpperCase(),
    firstName: address?.firstName ?? '',
    isDefaultBilling: address?.isDefaultBilling ?? false,
    isDefaultShipping: address?.isDefaultShipping ?? false,
    lastName: address?.lastName ?? '',
    phone: address?.phone ?? '',
    postalCode: address?.postalCode ?? '',
    stateAbbr: address?.stateAbbr ?? '',
    stateName: address?.stateName ?? '',
  }
}

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
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CustomerAddressInput>({
    defaultValues: getAddressFormValues({ address, fallbackCountry }),
    resolver: zodResolver(customerAddressSchema),
  })

  useEffect(() => {
    reset(getAddressFormValues({ address, fallbackCountry }))
  }, [address, fallbackCountry, reset])

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-w-3xl"
        closeLabel={t('account.cancel')}
        description={t('account.addressFormDescription')}
        title={address ? t('account.editAddress') : t('account.addAddress')}
      >
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AddressFormFields
            control={control}
            errors={errors}
            isPending={isPending}
            open={open}
            register={register}
            setValue={setValue}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              size="lg"
              type="button"
              variant="secondary"
            >
              {t('account.cancel')}
            </Button>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending
                ? t('account.savingAddress')
                : t('account.saveAddress')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
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
    <DialogRoot onOpenChange={onOpenChange} open={Boolean(address)}>
      <DialogContent
        className="max-w-xl"
        closeLabel={t('account.cancel')}
        description={t('account.deleteAddressDescription')}
        title={t('account.deleteAddressTitle')}
      >
        {address ? (
          <div className="mt-8 border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-normal text-foreground">{address.fullName}</p>
            {getAddressLines(address).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            size="lg"
            type="button"
            variant="secondary"
          >
            {t('account.cancel')}
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            size="lg"
            type="button"
            variant="danger"
          >
            {isPending
              ? t('account.removingAddress')
              : t('account.deleteAddress')}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
