export const CART_RESOURCE_ID_MISMATCH_MESSAGE =
  'The cart response does not match the requested cart.'

export class CartResourceIdentityMismatchError extends Error {
  constructor() {
    super(CART_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CartResourceIdentityMismatchError'
  }
}

export const CART_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a cart resource.'

export const CART_RESOURCE_TOKEN_MISSING_MESSAGE =
  'The cart response does not contain a usable token.'

export class CartResourceTypeMismatchError extends Error {
  constructor() {
    super(CART_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CartResourceTypeMismatchError'
  }
}

export class CartResourceTokenMissingError extends Error {
  constructor() {
    super(CART_RESOURCE_TOKEN_MISSING_MESSAGE)
    this.name = 'CartResourceTokenMissingError'
  }
}

function isRecord(value: unknown): value is { id?: unknown; token?: unknown } {
  return typeof value === 'object' && value !== null
}

export function isCartResourceIdentityMismatchError(
  error: unknown,
): error is CartResourceIdentityMismatchError {
  return error instanceof CartResourceIdentityMismatchError
}

export function isCartResourceTypeMismatchError(
  error: unknown,
): error is CartResourceTypeMismatchError {
  return error instanceof CartResourceTypeMismatchError
}

export function isCartResourceTokenMissingError(
  error: unknown,
): error is CartResourceTokenMissingError {
  return error instanceof CartResourceTokenMissingError
}

export function assertCartResourceMatchesId(
  resource: unknown,
  expectedCartId: string,
) {
  if (!isRecord(resource) || resource.id !== expectedCartId) {
    throw new CartResourceIdentityMismatchError()
  }
}

export function isCartResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('cart_') &&
    value.length > 'cart_'.length
  )
}

export function assertCartResourceIsCart(resource: unknown) {
  if (!isRecord(resource) || !isCartResourceId(resource.id)) {
    throw new CartResourceTypeMismatchError()
  }
}

export function assertCartResourceHasToken(resource: unknown) {
  if (
    !isRecord(resource) ||
    typeof resource.token !== 'string' ||
    !resource.token.trim()
  ) {
    throw new CartResourceTokenMissingError()
  }
}
