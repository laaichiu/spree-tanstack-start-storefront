export const PAYMENT_SESSION_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The payment session response is malformed.'

export class PaymentSessionResponseTypeMismatchError extends Error {
  constructor() {
    super(PAYMENT_SESSION_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'PaymentSessionResponseTypeMismatchError'
  }
}

export type PaymentSessionResponse = {
  cart_id?: string | null
  currency: string
  external_data: Record<string, unknown>
  external_id: string
  id: string
  order_id: string
  payment_method_id: string
  status: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

export function assertPaymentSessionResponse(
  response: unknown,
): asserts response is PaymentSessionResponse {
  if (
    !isRecord(response) ||
    !isNonBlankString(response.id) ||
    !isNonBlankString(response.status) ||
    !isNonBlankString(response.currency) ||
    !isNonBlankString(response.external_id) ||
    !isRecord(response.external_data) ||
    !isNonBlankString(response.payment_method_id) ||
    !isNonBlankString(response.order_id) ||
    ('cart_id' in response &&
      response.cart_id !== null &&
      response.cart_id !== undefined &&
      !isNonBlankString(response.cart_id))
  ) {
    throw new PaymentSessionResponseTypeMismatchError()
  }
}
