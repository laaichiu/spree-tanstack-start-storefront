export const CUSTOMER_AUTH_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The customer authentication response is malformed.'

export class CustomerAuthResponseTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_AUTH_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerAuthResponseTypeMismatchError'
  }
}

type CustomerAuthUser = {
  email: string
  first_name: string | null
  id: string
  last_name: string | null
}

export type CustomerAuthResponse = {
  refresh_token: string
  token: string
  user: CustomerAuthUser
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCustomerAuthUser(value: unknown): value is CustomerAuthUser {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.id) &&
    (value.first_name === null || typeof value.first_name === 'string') &&
    (value.last_name === null || typeof value.last_name === 'string')
  )
}

export function assertCustomerAuthResponse(
  response: unknown,
): asserts response is CustomerAuthResponse {
  if (
    !isRecord(response) ||
    !isNonEmptyString(response.refresh_token) ||
    !isNonEmptyString(response.token) ||
    !isCustomerAuthUser(response.user)
  ) {
    throw new CustomerAuthResponseTypeMismatchError()
  }
}
