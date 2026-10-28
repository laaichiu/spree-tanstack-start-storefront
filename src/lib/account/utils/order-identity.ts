export const CUSTOMER_ORDER_RESOURCE_ID_MISMATCH_MESSAGE =
  'The order response does not match the requested order.'

export class CustomerOrderResourceIdentityMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ORDER_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CustomerOrderResourceIdentityMismatchError'
  }
}

export const CUSTOMER_ORDER_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not an order resource.'

export class CustomerOrderResourceTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ORDER_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerOrderResourceTypeMismatchError'
  }
}

export function isCustomerOrderResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('or_') &&
    value.length > 'or_'.length
  )
}

export function assertCustomerOrderResourceIsOrder(resource: unknown) {
  if (
    typeof resource !== 'object' ||
    resource === null ||
    !isCustomerOrderResourceId('id' in resource ? resource.id : undefined)
  ) {
    throw new CustomerOrderResourceTypeMismatchError()
  }
}

export function assertCustomerOrderResourceMatchesId(
  resource: unknown,
  expectedOrderId: string,
) {
  const resourceId =
    typeof resource === 'object' && resource !== null && 'id' in resource
      ? resource.id
      : undefined

  if (
    !isCustomerOrderResourceId(resourceId) ||
    resourceId !== expectedOrderId
  ) {
    throw new CustomerOrderResourceIdentityMismatchError()
  }
}
