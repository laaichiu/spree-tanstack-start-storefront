import { Controller, useWatch } from 'react-hook-form'
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'

import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { AddressRegionFields } from '@/components/shared/address-region-fields'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { CustomerAddressInput } from '@/lib/account/validation/address'

type AddressFormFieldsProps = {
  control: Control<CustomerAddressInput>
  errors: FieldErrors<CustomerAddressInput>
  isPending: boolean
  open: boolean
  register: UseFormRegister<CustomerAddressInput>
  setValue: UseFormSetValue<CustomerAddressInput>
}

export function AddressFormFields({
  control,
  errors,
  isPending,
  open,
  register,
  setValue,
}: AddressFormFieldsProps) {
  const { t } = useMarket()
  const countryIso = useWatch({ control, name: 'countryIso' })
  const stateAbbr = useWatch({ control, name: 'stateAbbr' })
  const stateName = useWatch({ control, name: 'stateName' })
  const addressRegionLabels = {
    country: t('account.countryCode'),
    countryLoadFailed: t('account.addressCountriesLoadFailed'),
    countryPlaceholder: t('account.selectCountry'),
    loadingStates: t('account.loadingStates'),
    state: t('account.stateOrProvince'),
    statePlaceholder: t('account.selectState'),
    stateTextPlaceholder: t('account.stateName'),
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          autoComplete="given-name"
          className={accountAuthInputClassName}
          disabled={isPending}
          error={errors.firstName?.message}
          label={t('account.firstName')}
          labelClassName={accountAuthLabelClassName}
          placeholder={t('account.firstNamePlaceholder')}
          type="text"
          {...register('firstName')}
        />
        <Input
          autoComplete="family-name"
          className={accountAuthInputClassName}
          disabled={isPending}
          error={errors.lastName?.message}
          label={t('account.lastName')}
          labelClassName={accountAuthLabelClassName}
          placeholder={t('account.lastNamePlaceholder')}
          type="text"
          {...register('lastName')}
        />
      </div>

      <Input
        autoComplete="organization"
        className={accountAuthInputClassName}
        disabled={isPending}
        label={t('account.company')}
        labelClassName={accountAuthLabelClassName}
        placeholder={t('account.company')}
        type="text"
        {...register('company')}
      />

      <Input
        autoComplete="address-line1"
        className={accountAuthInputClassName}
        disabled={isPending}
        error={errors.address1?.message}
        label={t('account.addressLine1')}
        labelClassName={accountAuthLabelClassName}
        placeholder={t('account.addressLine1')}
        type="text"
        {...register('address1')}
      />

      <Input
        autoComplete="address-line2"
        className={accountAuthInputClassName}
        disabled={isPending}
        label={t('account.addressLine2')}
        labelClassName={accountAuthLabelClassName}
        placeholder={t('account.addressLine2')}
        type="text"
        {...register('address2')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          autoComplete="address-level2"
          className={accountAuthInputClassName}
          disabled={isPending}
          error={errors.city?.message}
          label={t('account.city')}
          labelClassName={accountAuthLabelClassName}
          placeholder={t('account.city')}
          type="text"
          {...register('city')}
        />
        <Input
          autoComplete="postal-code"
          className={accountAuthInputClassName}
          disabled={isPending}
          error={errors.postalCode?.message}
          label={t('account.postalCode')}
          labelClassName={accountAuthLabelClassName}
          placeholder={t('account.postalCode')}
          type="text"
          {...register('postalCode')}
        />
      </div>

      <AddressRegionFields
        countryError={errors.countryIso?.message}
        countryIso={countryIso}
        countrySelectId="account-address-country"
        disabled={isPending}
        enabled={open}
        labels={addressRegionLabels}
        onCountryChange={(value) => {
          setValue('countryIso', value, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue('stateAbbr', '', {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue('stateName', '', {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
        onStateAbbrChange={(value) => {
          setValue('stateAbbr', value, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue('stateName', '', {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
        onStateNameChange={(value) =>
          setValue('stateName', value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        stateAbbr={stateAbbr}
        stateInputId="account-address-state-name"
        stateName={stateName}
        stateSelectId="account-address-state"
      />

      <Input
        autoComplete="tel"
        className={accountAuthInputClassName}
        disabled={isPending}
        inputMode="tel"
        label={t('account.phone')}
        labelClassName={accountAuthLabelClassName}
        placeholder={t('account.phonePlaceholder')}
        type="tel"
        {...register('phone')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="isDefaultShipping"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              disabled={isPending}
              label={t('account.defaultShipping')}
              onCheckedChange={(value) => field.onChange(value === true)}
            />
          )}
        />
        <Controller
          control={control}
          name="isDefaultBilling"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              disabled={isPending}
              label={t('account.defaultBilling')}
              onCheckedChange={(value) => field.onChange(value === true)}
            />
          )}
        />
      </div>
    </>
  )
}
