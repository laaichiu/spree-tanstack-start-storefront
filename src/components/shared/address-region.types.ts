export type AddressRegionLabels = {
  country: string
  countryLoadFailed: string
  countryPlaceholder: string
  loadingStates: string
  state: string
  statePlaceholder: string
  stateTextPlaceholder: string
}

export type AddressCountryFieldProps = {
  className?: string
  controlClassName?: string
  disabled?: boolean
  enabled?: boolean
  error?: string
  id: string
  labelClassName?: string
  labels: Pick<
    AddressRegionLabels,
    'country' | 'countryLoadFailed' | 'countryPlaceholder'
  >
  name?: string
  onBlur?: () => void
  onCountryChange: (countryIso: string) => void
  value: string
}

export type AddressStateFieldProps = {
  className?: string
  controlClassName?: string
  countryIso: string
  disabled?: boolean
  enabled?: boolean
  error?: string
  inputId: string
  labelClassName?: string
  inputName?: string
  labels: Pick<
    AddressRegionLabels,
    'loadingStates' | 'state' | 'statePlaceholder' | 'stateTextPlaceholder'
  >
  onBlur?: () => void
  onStateAbbrChange: (stateAbbr: string) => void
  onStateNameChange: (stateName: string) => void
  selectId: string
  selectName?: string
  stateAbbr: string
  stateName: string
}

export type AddressRegionFieldsProps = {
  className?: string
  countryError?: string
  countryIso: string
  countrySelectId: string
  countrySelectName?: string
  disabled?: boolean
  enabled?: boolean
  labels: AddressRegionLabels
  onCountryChange: (countryIso: string) => void
  onStateAbbrChange: (stateAbbr: string) => void
  onStateNameChange: (stateName: string) => void
  stateError?: string
  stateInputId: string
  stateInputName?: string
  stateName: string
  stateSelectId: string
  stateSelectName?: string
  stateAbbr: string
}
