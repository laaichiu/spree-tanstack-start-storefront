import { isCountryCode } from '@/lib/core/market'

export const ADDRESS_COUNTRY_RESOURCE_ID_MISMATCH_MESSAGE =
  'The address country response does not match the requested country.'

export class AddressCountryResourceIdentityMismatchError extends Error {
  constructor() {
    super(ADDRESS_COUNTRY_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'AddressCountryResourceIdentityMismatchError'
  }
}

export const ADDRESS_COUNTRY_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The address country response is malformed.'

export class AddressCountryResourceTypeMismatchError extends Error {
  constructor() {
    super(ADDRESS_COUNTRY_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'AddressCountryResourceTypeMismatchError'
  }
}

type AddressCountryState = {
  abbr: string
  name: string
}

type AddressCountryDetailResource = {
  iso: string
  states?: AddressCountryState[]
  states_required: boolean
  zipcode_required: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStateRecord(value: unknown): value is AddressCountryState {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.abbr === 'string' && typeof value.name === 'string'
}

export function assertAddressCountryDetailResource(
  resource: unknown,
): asserts resource is AddressCountryDetailResource {
  if (
    !isRecord(resource) ||
    typeof resource.iso !== 'string' ||
    !isCountryCode(resource.iso) ||
    typeof resource.states_required !== 'boolean' ||
    typeof resource.zipcode_required !== 'boolean' ||
    (resource.states !== undefined &&
      (!Array.isArray(resource.states) ||
        !resource.states.every(isStateRecord)))
  ) {
    throw new AddressCountryResourceTypeMismatchError()
  }
}

export function assertAddressCountryResourceMatchesIso(
  resource: unknown,
  requestedCountryIso: string,
) {
  const responseCountryIso =
    isRecord(resource) && typeof resource.iso === 'string'
      ? resource.iso.trim().toUpperCase()
      : undefined
  const normalizedRequestedCountryIso = requestedCountryIso.trim().toUpperCase()

  if (responseCountryIso !== normalizedRequestedCountryIso) {
    throw new AddressCountryResourceIdentityMismatchError()
  }
}
