import { useMemo } from 'react'

import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { useAddressCountry } from '@/components/shared/use-address-countries'
import { cn } from '@/lib/utils'

import type { AddressStateFieldProps } from './address-region.types'
import { normalizeAddressRegionCode } from './address-region-utils'

export function AddressStateField({
  className,
  controlClassName,
  countryIso,
  disabled,
  enabled = true,
  error,
  inputId,
  labelClassName,
  inputName,
  labels,
  onBlur,
  onStateAbbrChange,
  onStateNameChange,
  selectId,
  selectName,
  stateAbbr,
  stateName,
}: AddressStateFieldProps) {
  const normalizedCountryIso = normalizeAddressRegionCode(countryIso)
  const normalizedStateAbbr = normalizeAddressRegionCode(stateAbbr)
  const addressCountryQuery = useAddressCountry(normalizedCountryIso, enabled)
  const stateOptions = useMemo(() => {
    const options = [
      {
        label: labels.statePlaceholder,
        value: '',
      },
      ...(addressCountryQuery.data?.states.map((state) => ({
        label: `${state.name} (${state.abbr})`,
        value: state.abbr,
      })) ?? []),
    ]

    if (
      normalizedStateAbbr &&
      !options.some((option) => option.value === normalizedStateAbbr)
    ) {
      options.push({
        label: normalizedStateAbbr,
        value: normalizedStateAbbr,
      })
    }

    return options
  }, [
    addressCountryQuery.data?.states,
    labels.statePlaceholder,
    normalizedStateAbbr,
  ])
  const hasStateOptions = stateOptions.length > 1

  if (addressCountryQuery.isLoading) {
    return (
      <Input
        className={cn(
          'h-12 bg-background text-lg leading-5',
          className,
          controlClassName,
        )}
        disabled
        id={inputId}
        label={labels.state}
        labelClassName={labelClassName}
        onBlur={onBlur ? () => onBlur() : undefined}
        placeholder={labels.loadingStates}
        type="text"
        value={stateName}
      />
    )
  }

  if (hasStateOptions) {
    return (
      <div className={className}>
        <NativeSelect
          className={cn(
            'h-12 bg-background text-lg leading-5',
            controlClassName,
          )}
          disabled={disabled}
          id={selectId}
          label={labels.state}
          labelClassName={labelClassName}
          name={selectName}
          onBlur={onBlur ? () => onBlur() : undefined}
          onValueChange={onStateAbbrChange}
          options={stateOptions}
          value={normalizedStateAbbr}
        />
        {error ? (
          <p className="text-sm leading-6 mt-2 text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <Input
      className={cn(
        'h-12 bg-background text-lg leading-5',
        className,
        controlClassName,
      )}
      disabled={disabled}
      error={error}
      id={inputId}
      label={labels.state}
      labelClassName={labelClassName}
      name={inputName}
      onBlur={onBlur ? () => onBlur() : undefined}
      onChange={(event) => onStateNameChange(event.currentTarget.value)}
      placeholder={labels.stateTextPlaceholder}
      type="text"
      value={stateName}
    />
  )
}
