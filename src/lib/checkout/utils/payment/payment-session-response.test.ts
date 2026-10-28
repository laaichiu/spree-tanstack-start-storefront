import { describe, expect, it } from 'vitest'

import {
  assertPaymentSessionResponse,
  PaymentSessionResponseTypeMismatchError,
} from './payment-session-response'
import { paymentSessionResource } from './payment-session-response.test-support'

describe('payment session response boundary', () => {
  it('accepts the fields consumed by checkout payment flow', () => {
    expect(() =>
      assertPaymentSessionResponse(paymentSessionResource()),
    ).not.toThrow()
  })

  it('accepts a nullable or explicit cart identity', () => {
    expect(() =>
      assertPaymentSessionResponse(paymentSessionResource({ cart_id: null })),
    ).not.toThrow()
    expect(() =>
      assertPaymentSessionResponse(
        paymentSessionResource({ cart_id: 'cart_123' }),
      ),
    ).not.toThrow()
  })

  it.each([
    ['id', { id: undefined }],
    ['status', { status: null }],
    ['currency', { currency: 42 }],
    ['external id', { external_id: null }],
    ['external data', { external_data: [] }],
    ['payment method id', { payment_method_id: {} }],
    ['order id', { order_id: '' }],
    ['cart id', { cart_id: 42 }],
  ])('rejects a malformed %s field', (_field, override) => {
    expect(() =>
      assertPaymentSessionResponse(paymentSessionResource(override)),
    ).toThrow(PaymentSessionResponseTypeMismatchError)
  })
})
