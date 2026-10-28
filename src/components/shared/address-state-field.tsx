import { useMarket } from '@/components/layout/market-provider'
import { useAddressCountry } from '@/lib/market/client/use-address-countries'
import { AddressStateFieldView } from './address-state-field-view'
import type { AddressStateFieldProps } from './address-region.types'
import {
  getAddressStateOptions,
  normalizeAddressRegionCode,
} from './address-region-options'

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
  const { market } = useMarket()
  const normalizedCountryIso = normalizeAddressRegionCode(countryIso)
  const normalizedStateAbbr = normalizeAddressRegionCode(stateAbbr)
  const addressCountryQuery = useAddressCountry({
    countryIso: normalizedCountryIso,
    enabled,
    market,
  })
  const stateOptions = [
    {
      label: labels.statePlaceholder,
      value: '',
    },
    ...getAddressStateOptions(addressCountryQuery.data, normalizedStateAbbr),
  ]

  return (
    <AddressStateFieldView
      actions={{
        blur: onBlur,
        stateAbbrChange: onStateAbbrChange,
        stateNameChange: onStateNameChange,
      }}
      className={className}
      controlClassName={controlClassName}
      disabled={disabled}
      error={error}
      inputId={inputId}
      inputName={inputName}
      isLoading={addressCountryQuery.isLoading}
      labelClassName={labelClassName}
      labels={{
        loadingStates: labels.loadingStates,
        state: labels.state,
        stateTextPlaceholder: labels.stateTextPlaceholder,
      }}
      options={stateOptions}
      selectId={selectId}
      selectName={selectName}
      stateAbbr={normalizedStateAbbr}
      stateName={stateName}
    />
  )
}
