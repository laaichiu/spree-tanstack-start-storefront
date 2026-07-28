import { useMemo } from 'react'

import { NativeSelect } from '@/components/ui/native-select'
import { useAddressCountries } from '@/components/shared/use-address-countries'
import { cn } from '@/lib/utils'

import type { AddressCountryFieldProps } from './address-region.types'
import { normalizeAddressRegionCode } from './address-region-utils'

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
  const normalizedCountryIso = normalizeAddressRegionCode(value)
  const addressCountriesQuery = useAddressCountries(enabled)
  const countryOptions = useMemo(() => {
    const options =
      addressCountriesQuery.data?.map((country) => ({
        label: `${country.name} (${country.iso.toUpperCase()})`,
        value: country.iso.toUpperCase(),
      })) ?? []

    if (
      normalizedCountryIso &&
      !options.some((option) => option.value === normalizedCountryIso)
    ) {
      options.push({
        label: normalizedCountryIso,
        value: normalizedCountryIso,
      })
    }

    return options.length
      ? options
      : [
          {
            disabled: true,
            label: labels.countryPlaceholder,
            value: '',
          },
        ]
  }, [
    addressCountriesQuery.data,
    labels.countryPlaceholder,
    normalizedCountryIso,
  ])

  return (
    <div className={className}>
      <NativeSelect
        className={cn('h-12 bg-background text-lg leading-5', controlClassName)}
        disabled={disabled || addressCountriesQuery.isLoading}
        id={id}
        label={labels.country}
        labelClassName={labelClassName}
        name={name}
        onBlur={onBlur ? () => onBlur() : undefined}
        onValueChange={onCountryChange}
        options={countryOptions}
        value={normalizedCountryIso}
      />
      {error ? (
        <p className="text-sm leading-6 mt-2 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {addressCountriesQuery.isError ? (
        <p className="text-sm leading-6 mt-2 text-destructive">
          {labels.countryLoadFailed}
        </p>
      ) : null}
    </div>
  )
}
