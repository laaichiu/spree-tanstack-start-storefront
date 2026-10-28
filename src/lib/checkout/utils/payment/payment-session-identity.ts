export const PAYMENT_SESSION_RESOURCE_ID_MISMATCH_MESSAGE =
  'The payment session response does not match the requested session.'
export const PAYMENT_SESSION_CART_ID_MISMATCH_MESSAGE =
  'The payment session response does not match the requested cart.'
export const PAYMENT_SESSION_PAYMENT_METHOD_ID_MISMATCH_MESSAGE =
  'The payment session response does not match the requested payment method.'

export class PaymentSessionResourceIdentityMismatchError extends Error {
  constructor() {
    super(PAYMENT_SESSION_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'PaymentSessionResourceIdentityMismatchError'
  }
}

export class PaymentSessionCartIdentityMismatchError extends Error {
  constructor() {
    super(PAYMENT_SESSION_CART_ID_MISMATCH_MESSAGE)
    this.name = 'PaymentSessionCartIdentityMismatchError'
  }
}

export class PaymentSessionPaymentMethodIdentityMismatchError extends Error {
  constructor() {
    super(PAYMENT_SESSION_PAYMENT_METHOD_ID_MISMATCH_MESSAGE)
    this.name = 'PaymentSessionPaymentMethodIdentityMismatchError'
  }
}

export function isPaymentSessionResourceIdentityMismatchError(
  error: unknown,
): error is PaymentSessionResourceIdentityMismatchError {
  return error instanceof PaymentSessionResourceIdentityMismatchError
}

export function isPaymentSessionCartIdentityMismatchError(
  error: unknown,
): error is PaymentSessionCartIdentityMismatchError {
  return error instanceof PaymentSessionCartIdentityMismatchError
}

export function isPaymentSessionPaymentMethodIdentityMismatchError(
  error: unknown,
): error is PaymentSessionPaymentMethodIdentityMismatchError {
  return error instanceof PaymentSessionPaymentMethodIdentityMismatchError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isPaymentSessionResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('ps_') &&
    value.length > 'ps_'.length
  )
}

export function assertPaymentSessionResourceIsPaymentSession(session: unknown) {
  if (!isRecord(session) || !isPaymentSessionResourceId(session.id)) {
    throw new PaymentSessionResourceIdentityMismatchError()
  }
}

export function assertPaymentSessionMatchesId(
  session: unknown,
  expectedSessionId: string,
) {
  assertPaymentSessionResourceIsPaymentSession(session)

  if (!isRecord(session)) {
    throw new PaymentSessionResourceIdentityMismatchError()
  }

  if (
    session.id !== expectedSessionId &&
    session.external_id !== expectedSessionId
  ) {
    throw new PaymentSessionResourceIdentityMismatchError()
  }
}

export function assertPaymentSessionMatchesCart(
  session: unknown,
  expectedCartId: string,
) {
  assertPaymentSessionResourceIsPaymentSession(session)

  if (!isRecord(session)) {
    throw new PaymentSessionCartIdentityMismatchError()
  }

  // Payment sessions may expose both cart and order ownership fields. The
  // cart-scoped endpoint is the authoritative ownership boundary, and
  // `cart_id` may be null after the session moves to a completed order.
  if (
    'cart_id' in session &&
    session.cart_id !== null &&
    session.cart_id !== undefined &&
    session.cart_id !== expectedCartId
  ) {
    throw new PaymentSessionCartIdentityMismatchError()
  }
}

export function assertPaymentSessionMatchesPaymentMethod(
  session: unknown,
  expectedPaymentMethodId: string,
) {
  assertPaymentSessionResourceIsPaymentSession(session)

  if (
    !isRecord(session) ||
    session.payment_method_id !== expectedPaymentMethodId
  ) {
    throw new PaymentSessionPaymentMethodIdentityMismatchError()
  }
}
