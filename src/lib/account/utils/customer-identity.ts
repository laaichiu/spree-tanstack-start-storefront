export const CUSTOMER_RESOURCE_ID_MISMATCH_MESSAGE =
  'The customer response does not match the authenticated customer.'

export class CustomerResourceIdentityMismatchError extends Error {
  constructor() {
    super(CUSTOMER_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CustomerResourceIdentityMismatchError'
  }
}

export const CUSTOMER_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a customer resource.'

export class CustomerResourceTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerResourceTypeMismatchError'
  }
}

export function isCustomerResourceId(value: unknown): value is string {
  return typeof value === 'string' && /^cust_.+/.test(value)
}

export function isCustomerResourceIdentityError(
  error: unknown,
): error is
  CustomerResourceIdentityMismatchError | CustomerResourceTypeMismatchError {
  return (
    error instanceof CustomerResourceIdentityMismatchError ||
    error instanceof CustomerResourceTypeMismatchError
  )
}

export function assertCustomerResourceIsCustomer(resource: unknown) {
  if (
    typeof resource !== 'object' ||
    resource === null ||
    !isCustomerResourceId('id' in resource ? resource.id : undefined)
  ) {
    throw new CustomerResourceTypeMismatchError()
  }
}

export function assertCustomerResourceMatchesId(
  resource: unknown,
  expectedCustomerId: string,
) {
  const resourceId =
    typeof resource === 'object' && resource !== null && 'id' in resource
      ? resource.id
      : undefined

  if (
    !isCustomerResourceId(resourceId) ||
    !isCustomerResourceId(expectedCustomerId) ||
    resourceId !== expectedCustomerId
  ) {
    throw new CustomerResourceIdentityMismatchError()
  }
}
