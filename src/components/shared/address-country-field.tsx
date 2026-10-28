import { useMarket } from '@/components/layout/market-provider'
import { useAddressCountries } from '@/lib/market/client/use-address-countries'
import { AddressCountryFieldView } from './address-country-field-view'
import type { AddressCountryFieldProps } from './address-region.types'
import {
  getAddressCountryOptions,
  normalizeAddressRegionCode,
} from './address-region-options'

export function AddressCountryField({
  className,
  controlClassName,
  disabled,
  enabled = true,
  error,
  id,
  labelClassName,
  labels,
  name,
  onBlur,
  onCountryChange,
  value,
}: AddressCountryFieldProps) {
  const { market } = useMarket()
  const normalizedCountryIso = normalizeAddressRegionCode(value)
  const addressCountriesQuery = useAddressCountries({ enabled, market })
  const availableCountryOptions = getAddressCountryOptions(
    addressCountriesQuery.data ?? [],
    normalizedCountryIso,
  )
  const countryOptions = availableCountryOptions.length
    ? availableCountryOptions
    : [
        {
          disabled: true,
          label: labels.countryPlaceholder,
          value: '',
        },
      ]

  return (
    <AddressCountryFieldView
      actions={{
        blur: onBlur,
        countryChange: onCountryChange,
      }}
      className={className}
      controlClassName={controlClassName}
      disabled={disabled}
      error={error}
      id={id}
      isLoading={addressCountriesQuery.isLoading}
      labelClassName={labelClassName}
      labels={{ country: labels.country }}
      loadError={
        addressCountriesQuery.isError ? labels.countryLoadFailed : undefined
      }
      name={name}
      options={countryOptions}
      value={normalizedCountryIso}
    />
  )
}
