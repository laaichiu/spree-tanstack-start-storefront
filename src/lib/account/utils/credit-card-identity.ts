export const CUSTOMER_CREDIT_CARD_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a credit card resource.'

export class CustomerCreditCardResourceTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_CREDIT_CARD_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerCreditCardResourceTypeMismatchError'
  }
}

type CustomerCreditCardResource = {
  brand: string
  default: boolean
  gateway_payment_profile_id: string | null
  id: string
  last4: string
  month: number
  name: string | null
  year: number
}

export function isCustomerCreditCardResourceId(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('card_') &&
    value.length > 'card_'.length
  )
}

export function assertCustomerCreditCardId(value: string) {
  if (!isCustomerCreditCardResourceId(value)) {
    throw new CustomerCreditCardResourceTypeMismatchError()
  }
}

export function assertCustomerCreditCardResourceIsCreditCard(
  resource: unknown,
): asserts resource is CustomerCreditCardResource {
  if (!isCreditCardResource(resource)) {
    throw new CustomerCreditCardResourceTypeMismatchError()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isCreditCardResource(
  resource: unknown,
): resource is CustomerCreditCardResource {
  if (!isRecord(resource)) {
    return false
  }

  return (
    isCustomerCreditCardResourceId(resource.id) &&
    typeof resource.brand === 'string' &&
    typeof resource.last4 === 'string' &&
    isFiniteNumber(resource.month) &&
    isFiniteNumber(resource.year) &&
    isNullableString(resource.name) &&
    typeof resource.default === 'boolean' &&
    isNullableString(resource.gateway_payment_profile_id)
  )
}
