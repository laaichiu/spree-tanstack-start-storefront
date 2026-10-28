export const CART_ORDER_RESOURCE_IDENTITY_MISMATCH_MESSAGE =
  'The cart order response does not match the requested cart handle.'

export class CartOrderResourceIdentityMismatchError extends Error {
  constructor() {
    super(CART_ORDER_RESOURCE_IDENTITY_MISMATCH_MESSAGE)
    this.name = 'CartOrderResourceIdentityMismatchError'
  }
}

export function isCartOrderResourceIdentityMismatchError(error: unknown) {
  return error instanceof CartOrderResourceIdentityMismatchError
}

export function assertCartOrderResourceMatchesCartHandle(
  resource: unknown,
  cartId: string,
) {
  if (
    !cartId ||
    !isRecordWithOptionalId(resource) ||
    !isCartOrderResourceId(resource.id)
  ) {
    throw new CartOrderResourceIdentityMismatchError()
  }
}

export function isCartOrderResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('or_') &&
    value.length > 'or_'.length
  )
}

function isRecordWithOptionalId(
  resource: unknown,
): resource is { id?: unknown } {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    !Array.isArray(resource)
  )
}
