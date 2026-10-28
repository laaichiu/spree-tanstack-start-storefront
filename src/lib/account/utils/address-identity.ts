import { isCountryCode } from '@/lib/core/market-format'

export const CUSTOMER_ADDRESS_RESOURCE_ID_MISMATCH_MESSAGE =
  'The address response does not match the requested address.'

export class CustomerAddressResourceIdentityMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ADDRESS_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CustomerAddressResourceIdentityMismatchError'
  }
}

export const CUSTOMER_ADDRESS_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not an address resource.'

export class CustomerAddressResourceTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ADDRESS_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerAddressResourceTypeMismatchError'
  }
}

type CustomerAddressResource = {
  address1: string | null
  address2: string | null
  city: string | null
  company: string | null
  country_code: string
  first_name: string | null
  full_name: string
  id: string
  is_default_billing: boolean
  is_default_shipping: boolean
  last_name: string | null
  phone: string | null
  postal_code: string | null
  quick_checkout: boolean
  state_code: string | null
  state_name: string | null
  state_text: string | null
}

export function isCustomerAddressResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('addr_') &&
    value.length > 'addr_'.length
  )
}

export function assertCustomerAddressId(value: string) {
  if (!isCustomerAddressResourceId(value)) {
    throw new CustomerAddressResourceTypeMismatchError()
  }
}

export function assertCustomerAddressResourceIsAddress(
  resource: unknown,
): asserts resource is CustomerAddressResource {
  if (!isAddressResource(resource)) {
    throw new CustomerAddressResourceTypeMismatchError()
  }
}

export function assertCustomerAddressResourceMatchesId(
  resource: unknown,
  expectedAddressId: string,
) {
  const resourceId =
    typeof resource === 'object' && resource !== null && 'id' in resource
      ? resource.id
      : undefined

  if (
    !isCustomerAddressResourceId(resourceId) ||
    resourceId !== expectedAddressId
  ) {
    throw new CustomerAddressResourceIdentityMismatchError()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isAddressResource(
  resource: unknown,
): resource is CustomerAddressResource {
  if (!isRecord(resource)) {
    return false
  }

  return (
    isCustomerAddressResourceId(resource.id) &&
    isNullableString(resource.first_name) &&
    isNullableString(resource.last_name) &&
    typeof resource.full_name === 'string' &&
    isNullableString(resource.address1) &&
    isNullableString(resource.address2) &&
    isNullableString(resource.postal_code) &&
    isNullableString(resource.city) &&
    isNullableString(resource.phone) &&
    isNullableString(resource.company) &&
    typeof resource.country_code === 'string' &&
    isCountryCode(resource.country_code) &&
    isNullableString(resource.state_text) &&
    isNullableString(resource.state_code) &&
    typeof resource.quick_checkout === 'boolean' &&
    typeof resource.is_default_billing === 'boolean' &&
    typeof resource.is_default_shipping === 'boolean' &&
    isNullableString(resource.state_name)
  )
}
