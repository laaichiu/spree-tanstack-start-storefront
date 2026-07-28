import { useMarket } from '@/components/layout/market-provider'
import {
  AddressCountryField,
  AddressStateField,
} from '@/components/shared/address-region-fields'
import type { AddressRegionLabels } from '@/components/shared/address-region.types'
import { Input } from '@/components/ui/input'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import type {
  FieldErrors,
  Path,
  UseFormRegisterReturn,
  UseFormReturn,
} from 'react-hook-form'

import { checkoutFieldClassName, checkoutLabelClassName } from './checkout-form'

type PostalAddressFormValues = Pick<
  CheckoutAddressInput | CheckoutBillingAddressInput,
  | 'address1'
  | 'address2'
  | 'city'
  | 'company'
  | 'countryIso'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'postalCode'
  | 'stateAbbr'
  | 'stateName'
>

type PostalAddressFieldName = keyof PostalAddressFormValues

type PostalAddressRegionConfig = {
  countryIso: string
  countryId: string
  labels: AddressRegionLabels
  onBlur?: () => void
  onCountryChange: (countryIso: string) => void
  onStateAbbrChange: (stateAbbr: string) => void
  onStateNameChange: (stateName: string) => void
  stateAbbr: string
  stateInputId: string
  stateName: string
  stateSelectId: string
}

export type CheckoutPostalAddressFieldsProps<
  TForm extends PostalAddressFormValues,
> = {
  form: UseFormReturn<TForm>
  phoneLabel: string
  phonePlaceholder: string
  region: PostalAddressRegionConfig
  disabled?: boolean
}

function registerPostalAddressField<TForm extends PostalAddressFormValues>(
  form: UseFormReturn<TForm>,
  field: PostalAddressFieldName,
): UseFormRegisterReturn {
  return form.register(field as Path<TForm>)
}

function getPostalAddressErrorMessage<TForm extends PostalAddressFormValues>(
  errors: FieldErrors<TForm>,
  field: PostalAddressFieldName,
) {
  const error = errors[field as keyof FieldErrors<TForm>]
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return undefined
  }

  const message = (error as { message?: unknown }).message
  return typeof message === 'string' ? message : undefined
}

export function CheckoutPostalAddressFields<
  TForm extends PostalAddressFormValues,
>({
  disabled,
  form,
  phoneLabel,
  phonePlaceholder,
  region,
}: CheckoutPostalAddressFieldsProps<TForm>) {
  const { t } = useMarket()
  const { errors } = form.formState

  return (
    <>
      <AddressCountryField
        className="w-full"
        controlClassName={checkoutFieldClassName}
        disabled={disabled}
        error={getPostalAddressErrorMessage(errors, 'countryIso')}
        id={region.countryId}
        labelClassName={checkoutLabelClassName}
        labels={region.labels}
        name="countryIso"
        onBlur={region.onBlur}
        onCountryChange={region.onCountryChange}
        value={region.countryIso}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          className={checkoutFieldClassName}
          disabled={disabled}
          error={getPostalAddressErrorMessage(errors, 'firstName')}
          label={t('checkout.firstName')}
          labelClassName={checkoutLabelClassName}
          placeholder={t('checkout.firstName')}
          {...registerPostalAddressField(form, 'firstName')}
        />
        <Input
          className={checkoutFieldClassName}
          disabled={disabled}
          error={getPostalAddressErrorMessage(errors, 'lastName')}
          label={t('checkout.lastName')}
          labelClassName={checkoutLabelClassName}
          placeholder={t('checkout.lastName')}
          {...registerPostalAddressField(form, 'lastName')}
        />
      </div>
      <Input
        className={checkoutFieldClassName}
        disabled={disabled}
        error={getPostalAddressErrorMessage(errors, 'company')}
        label={t('checkout.company')}
        labelClassName={checkoutLabelClassName}
        placeholder={t('checkout.companyOptional')}
        {...registerPostalAddressField(form, 'company')}
      />
      <Input
        className={checkoutFieldClassName}
        disabled={disabled}
        error={getPostalAddressErrorMessage(errors, 'address1')}
        label={t('checkout.address')}
        labelClassName={checkoutLabelClassName}
        placeholder={t('checkout.addressPlaceholder')}
        {...registerPostalAddressField(form, 'address1')}
      />
      <Input
        className={checkoutFieldClassName}
        disabled={disabled}
        error={getPostalAddressErrorMessage(errors, 'address2')}
        label={t('checkout.addressLine2')}
        labelClassName={checkoutLabelClassName}
        placeholder={t('checkout.addressLine2Optional')}
        {...registerPostalAddressField(form, 'address2')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          className={checkoutFieldClassName}
          disabled={disabled}
          error={getPostalAddressErrorMessage(errors, 'city')}
          label={t('checkout.city')}
          labelClassName={checkoutLabelClassName}
          placeholder={t('checkout.city')}
          {...registerPostalAddressField(form, 'city')}
        />
        <AddressStateField
          controlClassName={checkoutFieldClassName}
          countryIso={region.countryIso}
          disabled={disabled}
          error={
            getPostalAddressErrorMessage(errors, 'stateAbbr') ??
            getPostalAddressErrorMessage(errors, 'stateName')
          }
          inputId={region.stateInputId}
          inputName="stateName"
          labelClassName={checkoutLabelClassName}
          labels={region.labels}
          onBlur={region.onBlur}
          onStateAbbrChange={region.onStateAbbrChange}
          onStateNameChange={region.onStateNameChange}
          selectId={region.stateSelectId}
          selectName="stateAbbr"
          stateAbbr={region.stateAbbr}
          stateName={region.stateName}
        />
        <Input
          className={checkoutFieldClassName}
          disabled={disabled}
          error={getPostalAddressErrorMessage(errors, 'postalCode')}
          label={t('checkout.postalCode')}
          labelClassName={checkoutLabelClassName}
          placeholder={t('checkout.postalCode')}
          {...registerPostalAddressField(form, 'postalCode')}
        />
      </div>
      <Input
        className={checkoutFieldClassName}
        disabled={disabled}
        error={getPostalAddressErrorMessage(errors, 'phone')}
        label={phoneLabel}
        labelClassName={checkoutLabelClassName}
        placeholder={phonePlaceholder}
        {...registerPostalAddressField(form, 'phone')}
      />
    </>
  )
}
