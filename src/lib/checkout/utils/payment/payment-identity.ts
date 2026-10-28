export const PAYMENT_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a payment resource.'
export const PAYMENT_RESOURCE_METHOD_MISMATCH_MESSAGE =
  'The payment response does not match the requested payment method.'

export class PaymentResourceTypeMismatchError extends Error {
  constructor() {
    super(PAYMENT_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'PaymentResourceTypeMismatchError'
  }
}

export class PaymentResourceMethodMismatchError extends Error {
  constructor() {
    super(PAYMENT_RESOURCE_METHOD_MISMATCH_MESSAGE)
    this.name = 'PaymentResourceMethodMismatchError'
  }
}

export function isPaymentResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('pay_') &&
    value.length > 'pay_'.length
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function assertPaymentResourceIsPayment(resource: unknown) {
  if (!isRecord(resource) || !isPaymentResourceId(resource.id)) {
    throw new PaymentResourceTypeMismatchError()
  }
}

export function assertPaymentMatchesPaymentMethod(
  resource: unknown,
  expectedPaymentMethodId: string,
) {
  assertPaymentResourceIsPayment(resource)

  if (
    !isRecord(resource) ||
    resource.payment_method_id !== expectedPaymentMethodId
  ) {
    throw new PaymentResourceMethodMismatchError()
  }
}
