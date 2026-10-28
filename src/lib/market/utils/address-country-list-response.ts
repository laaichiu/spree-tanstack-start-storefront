import { isCountryCode } from '@/lib/core/market'

export const ADDRESS_COUNTRY_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The address country list response is malformed.'

export class AddressCountryListResponseTypeMismatchError extends Error {
  constructor() {
    super(ADDRESS_COUNTRY_LIST_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'AddressCountryListResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertAddressCountryListResponse(
  response: unknown,
): asserts response is { data: unknown[] } {
  if (!isRecord(response) || !Array.isArray(response.data)) {
    throw new AddressCountryListResponseTypeMismatchError()
  }
}

type AddressCountryState = {
  abbr: string
  name: string
}

type AddressCountryResource = {
  iso: string
  states?: AddressCountryState[]
  states_required: boolean
  zipcode_required: boolean
}

function isStateRecord(value: unknown): value is AddressCountryState {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.abbr === 'string' && typeof value.name === 'string'
}

function isCountryRecord(value: unknown): value is AddressCountryResource {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.iso === 'string' &&
    isCountryCode(value.iso) &&
    typeof value.states_required === 'boolean' &&
    typeof value.zipcode_required === 'boolean' &&
    (value.states === undefined ||
      (Array.isArray(value.states) && value.states.every(isStateRecord)))
  )
}

export function assertAddressCountryResourceIsCountry(resource: unknown) {
  if (!isCountryRecord(resource)) {
    throw new AddressCountryListResponseTypeMismatchError()
  }
}
