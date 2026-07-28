export type AddressState = {
  abbr: string
  name: string
}

export type AddressCountry = {
  iso: string
  name: string
  states: AddressState[]
  statesRequired: boolean
  zipcodeRequired: boolean
}
