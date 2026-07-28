import { AddressCountryField } from './address-country-field'
import { AddressStateField } from './address-state-field'
import type { AddressRegionFieldsProps } from './address-region.types'
import { cn } from '@/lib/utils'

export { AddressCountryField } from './address-country-field'
export { AddressStateField } from './address-state-field'
export type {
  AddressCountryFieldProps,
  AddressRegionFieldsProps,
  AddressRegionLabels,
  AddressStateFieldProps,
} from './address-region.types'

export function AddressRegionFields({
  className,
  countryError,
  countryIso,
  countrySelectId,
  countrySelectName,
  disabled,
  enabled,
  labels,
  onCountryChange,
  onStateAbbrChange,
  onStateNameChange,
  stateError,
  stateInputId,
  stateInputName,
  stateName,
  stateSelectId,
  stateSelectName,
  stateAbbr,
}: AddressRegionFieldsProps) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2', className)}>
      <AddressCountryField
        disabled={disabled}
        enabled={enabled}
        error={countryError}
        id={countrySelectId}
        labels={labels}
        name={countrySelectName}
        onCountryChange={onCountryChange}
        value={countryIso}
      />
      <AddressStateField
        countryIso={countryIso}
        disabled={disabled}
        enabled={enabled}
        error={stateError}
        inputId={stateInputId}
        inputName={stateInputName}
        labels={labels}
        onStateAbbrChange={onStateAbbrChange}
        onStateNameChange={onStateNameChange}
        selectId={stateSelectId}
        selectName={stateSelectName}
        stateAbbr={stateAbbr}
        stateName={stateName}
      />
    </div>
  )
}
