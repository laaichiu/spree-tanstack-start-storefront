export const CUSTOMER_SESSION_REQUIRED_ERROR_CODE = 'customer_session_required'

export class CustomerSessionRequiredError extends Error {
  readonly code = CUSTOMER_SESSION_REQUIRED_ERROR_CODE

  constructor() {
    super('Customer session is required.')
    this.name = 'CustomerSessionRequiredError'
  }
}

export function isCustomerSessionRequiredError(error: unknown) {
  if (error instanceof CustomerSessionRequiredError) {
    return true
  }

  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    'code' in error &&
    (error as { code?: unknown }).code === CUSTOMER_SESSION_REQUIRED_ERROR_CODE
  )
}
