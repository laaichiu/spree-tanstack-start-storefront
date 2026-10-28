import { isDecimalMoneyAmount } from '@/lib/core/decimal-money'

export const CUSTOMER_PROFILE_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The customer profile response is malformed.'

export class CustomerProfileResponseTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_PROFILE_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerProfileResponseTypeMismatchError'
  }
}

type CustomerProfileResponseFields = {
  accepts_email_marketing: boolean
  available_store_credit_total: string
  email: string
  first_name: string | null
  id: string
  last_name: string | null
  phone: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCustomerProfileResponseFields(
  value: unknown,
): value is CustomerProfileResponseFields {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.accepts_email_marketing === 'boolean' &&
    isDecimalMoneyAmount(value.available_store_credit_total) &&
    typeof value.email === 'string' &&
    (value.first_name === null || typeof value.first_name === 'string') &&
    typeof value.id === 'string' &&
    (value.last_name === null || typeof value.last_name === 'string') &&
    (value.phone === null || typeof value.phone === 'string')
  )
}

export function assertCustomerProfileResponse(
  response: unknown,
): asserts response is CustomerProfileResponseFields {
  if (!isCustomerProfileResponseFields(response)) {
    throw new CustomerProfileResponseTypeMismatchError()
  }
}

export function isCustomerProfileResponseTypeMismatchError(
  error: unknown,
): error is CustomerProfileResponseTypeMismatchError {
  return error instanceof CustomerProfileResponseTypeMismatchError
}
