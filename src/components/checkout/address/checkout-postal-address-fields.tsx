import { useMarket } from '@/components/layout/market-provider'
import {
  AddressCountryField,
  AddressStateField,
} from '@/components/shared/address-region-fields'
import type { AddressRegionLabels } from '@/components/shared/address-region.types'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/contracts'
import type { FieldErrors, Path, UseFormReturn } from 'react-hook-form'

import {
  themeCheckoutFieldClassName,
  themeCheckoutLabelClassName,
} from '@/components/checkout/checkout-field-styles'
import { CheckoutPostalAddressFieldsView } from '@/components/checkout/checkout-postal-address-fields-view'

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

function getPostalAddressErrorMessage<TForm extends PostalAddressFormValues>(
  errors: FieldErrors<TForm>,
  field: PostalAddressFieldName,
): string | undefined {
  const error = errors[field as keyof FieldErrors<TForm>]

  if (!error || typeof error !== 'object' || !('message' in error)) {
    return undefined
  }

  return typeof error.message === 'string' ? error.message : undefined
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
  const getErrorMessage = (field: PostalAddressFieldName) =>
    getPostalAddressErrorMessage(errors, field)
  const textField = (
    field: PostalAddressFieldName,
    label: string,
    placeholder: string,
  ) => ({
    ...form.register(field as Path<TForm>),
    className: themeCheckoutFieldClassName,
    disabled,
    error: getErrorMessage(field),
    label,
    labelClassName: themeCheckoutLabelClassName,
    placeholder,
  })

  return (
    <CheckoutPostalAddressFieldsView
      model={{
        address1: textField(
          'address1',
          t('checkout.address'),
          t('checkout.addressPlaceholder'),
        ),
        address2: textField(
          'address2',
          t('checkout.addressLine2'),
          t('checkout.addressLine2Optional'),
        ),
        city: textField('city', t('checkout.city'), t('checkout.city')),
        company: textField(
          'company',
          t('checkout.company'),
          t('checkout.companyOptional'),
        ),
        country: (
          <AddressCountryField
            className="w-full"
            controlClassName={themeCheckoutFieldClassName}
            disabled={disabled}
            error={getErrorMessage('countryIso')}
            id={region.countryId}
            labelClassName={themeCheckoutLabelClassName}
            labels={region.labels}
            name="countryIso"
            onBlur={region.onBlur}
            onCountryChange={region.onCountryChange}
            value={region.countryIso}
          />
        ),
        firstName: textField(
          'firstName',
          t('checkout.firstName'),
          t('checkout.firstName'),
        ),
        lastName: textField(
          'lastName',
          t('checkout.lastName'),
          t('checkout.lastName'),
        ),
        phone: textField('phone', phoneLabel, phonePlaceholder),
        postalCode: textField(
          'postalCode',
          t('checkout.postalCode'),
          t('checkout.postalCode'),
        ),
        state: (
          <AddressStateField
            controlClassName={themeCheckoutFieldClassName}
            countryIso={region.countryIso}
            disabled={disabled}
            error={getErrorMessage('stateAbbr') ?? getErrorMessage('stateName')}
            inputId={region.stateInputId}
            inputName="stateName"
            labelClassName={themeCheckoutLabelClassName}
            labels={region.labels}
            onBlur={region.onBlur}
            onStateAbbrChange={region.onStateAbbrChange}
            onStateNameChange={region.onStateNameChange}
            selectId={region.stateSelectId}
            selectName="stateAbbr"
            stateAbbr={region.stateAbbr}
            stateName={region.stateName}
          />
        ),
      }}
    />
  )
}
