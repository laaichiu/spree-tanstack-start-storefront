export const CHECKOUT_ORDER_RESOURCE_ID_MISMATCH_MESSAGE =
  'The checkout order response does not match the requested resource.'

export class CheckoutOrderResourceIdentityMismatchError extends Error {
  constructor() {
    super(CHECKOUT_ORDER_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CheckoutOrderResourceIdentityMismatchError'
  }
}

export function isCheckoutOrderResourceIdentityMismatchError(
  error: unknown,
): error is CheckoutOrderResourceIdentityMismatchError {
  return error instanceof CheckoutOrderResourceIdentityMismatchError
}

export function isCheckoutOrderResourceIdentityCompatible(
  resource: unknown,
  requestedId: string,
) {
  if (
    !isRecordWithOptionalId(resource) ||
    !isCheckoutOrderLookupId(requestedId)
  ) {
    return false
  }

  if (requestedId.startsWith('cart_')) {
    return (
      isCheckoutOrderResourceId(resource.id) ||
      isCheckoutOrderGroupResourceId(resource.id)
    )
  }

  return (
    (isCheckoutOrderResourceId(resource.id) ||
      isCheckoutOrderGroupResourceId(resource.id)) &&
    resource.id === requestedId
  )
}

export function isCheckoutOrderResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('or_') &&
    value.length > 'or_'.length
  )
}

export function isCheckoutOrderGroupResourceId(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('ogrp_') &&
    value.length > 'ogrp_'.length
  )
}

export function isCheckoutOrderLookupId(value: unknown): value is string {
  return (
    (typeof value === 'string' &&
      value.startsWith('cart_') &&
      value.length > 'cart_'.length) ||
    isCheckoutOrderResourceId(value) ||
    isCheckoutOrderGroupResourceId(value)
  )
}

export function assertCheckoutOrderResourceMatchesRequestedId(
  resource: unknown,
  requestedId: string,
) {
  if (!isCheckoutOrderResourceIdentityCompatible(resource, requestedId)) {
    throw new CheckoutOrderResourceIdentityMismatchError()
  }
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
