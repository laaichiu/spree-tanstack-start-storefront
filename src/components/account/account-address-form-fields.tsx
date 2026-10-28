import { useController, useWatch } from 'react-hook-form'
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'

import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from '@/components/account/account-ui-view'
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
  const { field: defaultShippingField } = useController({
    control,
    name: 'isDefaultShipping',
  })
  const { field: defaultBillingField } = useController({
    control,
    name: 'isDefaultBilling',
  })
  const inputProps = {
    className: accountAuthInputClassName,
    disabled: isPending,
    labelClassName: accountAuthLabelClassName,
    type: 'text' as const,
  }
  const regionUpdateOptions = { shouldDirty: true, shouldValidate: true }
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
          {...register('firstName')}
          {...inputProps}
          autoComplete="given-name"
          error={errors.firstName?.message}
          label={t('account.firstName')}
          placeholder={t('account.firstNamePlaceholder')}
        />
        <Input
          {...register('lastName')}
          {...inputProps}
          autoComplete="family-name"
          error={errors.lastName?.message}
          label={t('account.lastName')}
          placeholder={t('account.lastNamePlaceholder')}
        />
      </div>
      <Input
        {...register('company')}
        {...inputProps}
        autoComplete="organization"
        label={t('account.company')}
        placeholder={t('account.company')}
      />
      <Input
        {...register('address1')}
        {...inputProps}
        autoComplete="address-line1"
        error={errors.address1?.message}
        label={t('account.addressLine1')}
        placeholder={t('account.addressLine1')}
      />
      <Input
        {...register('address2')}
        {...inputProps}
        autoComplete="address-line2"
        label={t('account.addressLine2')}
        placeholder={t('account.addressLine2')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          {...register('city')}
          {...inputProps}
          autoComplete="address-level2"
          error={errors.city?.message}
          label={t('account.city')}
          placeholder={t('account.city')}
        />
        <Input
          {...register('postalCode')}
          {...inputProps}
          autoComplete="postal-code"
          error={errors.postalCode?.message}
          label={t('account.postalCode')}
          placeholder={t('account.postalCode')}
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
          setValue('countryIso', value, regionUpdateOptions)
          setValue('stateAbbr', '', regionUpdateOptions)
          setValue('stateName', '', regionUpdateOptions)
        }}
        onStateAbbrChange={(value) => {
          setValue('stateAbbr', value, regionUpdateOptions)
          setValue('stateName', '', regionUpdateOptions)
        }}
        onStateNameChange={(value) =>
          setValue('stateName', value, regionUpdateOptions)
        }
        stateAbbr={stateAbbr}
        stateInputId="account-address-state-name"
        stateName={stateName}
        stateSelectId="account-address-state"
      />
      <Input
        {...register('phone')}
        {...inputProps}
        autoComplete="tel"
        inputMode="tel"
        label={t('account.phone')}
        placeholder={t('account.phonePlaceholder')}
        type="tel"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox
          checked={defaultShippingField.value}
          disabled={isPending}
          label={t('account.defaultShipping')}
          onCheckedChange={(value) =>
            defaultShippingField.onChange(value === true)
          }
        />
        <Checkbox
          checked={defaultBillingField.value}
          disabled={isPending}
          label={t('account.defaultBilling')}
          onCheckedChange={(value) =>
            defaultBillingField.onChange(value === true)
          }
        />
      </div>
    </>
  )
}
