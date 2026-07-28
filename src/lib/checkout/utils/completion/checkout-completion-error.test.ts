import { describe, expect, it } from 'vitest'

import {
  getCheckoutCompletionErrorMessage,
  getCheckoutCompletionErrorMessageKey,
  getCheckoutPaymentErrorNotice,
  getCheckoutPaymentErrorSignature,
  isCheckoutCompletionErrorCode,
  parseCheckoutPaymentErrorSearch,
} from './checkout-completion-error'

describe('checkout completion error helpers', () => {
  it('recognizes stable checkout completion error codes', () => {
    expect(isCheckoutCompletionErrorCode('payment_failed')).toBe(true)
    expect(isCheckoutCompletionErrorCode('payment_session_not_ready')).toBe(
      true,
    )
    expect(isCheckoutCompletionErrorCode('')).toBe(false)
    expect(isCheckoutCompletionErrorCode('stripe_declined')).toBe(false)
    expect(isCheckoutCompletionErrorCode(null)).toBe(false)
  })

  it('maps checkout completion error codes to message keys', () => {
    expect(getCheckoutCompletionErrorMessageKey('order_complete_failed')).toBe(
      'checkout.orderCompleteFailed',
    )
    expect(getCheckoutCompletionErrorMessageKey('payment_failed')).toBe(
      'checkout.paymentFailed',
    )
  })

  it('prefers localized messages for known error codes', () => {
    expect(
      getCheckoutCompletionErrorMessage({
        error: 'Payment was not successful. Please try again.',
        errorCode: 'payment_failed',
        t: (key) => `translated:${key}`,
      }),
    ).toBe('translated:checkout.paymentFailed')
  })

  it('falls back to the raw error only when no code is available', () => {
    expect(
      getCheckoutCompletionErrorMessage({
        error: 'Gateway error',
        t: (key) => `translated:${key}`,
      }),
    ).toBe('Gateway error')

    expect(
      getCheckoutCompletionErrorMessage({
        t: (key) => `translated:${key}`,
      }),
    ).toBe('translated:checkout.paymentFailed')
  })

  it('builds stable payment error signatures', () => {
    expect(
      getCheckoutPaymentErrorSignature({
        error: 'Gateway unavailable',
        errorCode: 'payment_failed',
      }),
    ).toBe('payment_failed:Gateway unavailable')

    expect(
      getCheckoutPaymentErrorSignature({
        error: 'Gateway unavailable',
      }),
    ).toBe(':Gateway unavailable')

    expect(
      getCheckoutPaymentErrorSignature({
        errorCode: 'payment_session_not_ready',
      }),
    ).toBe('payment_session_not_ready:')

    expect(getCheckoutPaymentErrorSignature({})).toBeNull()
  })

  it('resolves pending payment error notices and suppresses duplicates', () => {
    const notice = getCheckoutPaymentErrorNotice({
      error: 'Gateway unavailable',
      errorCode: 'payment_failed',
      t: (key) => `translated:${key}`,
    })

    expect(notice).toEqual({
      message: 'translated:checkout.paymentFailed',
      signature: 'payment_failed:Gateway unavailable',
    })

    expect(
      getCheckoutPaymentErrorNotice({
        appliedSignature: notice?.signature,
        error: 'Gateway unavailable',
        errorCode: 'payment_failed',
        t: (key) => `translated:${key}`,
      }),
    ).toBeNull()
  })

  it('parses checkout payment error search params', () => {
    expect(
      parseCheckoutPaymentErrorSearch({
        payment_error: 'Gateway unavailable',
        payment_error_code: 'payment_failed',
      }),
    ).toEqual({
      payment_error: 'Gateway unavailable',
      payment_error_code: 'payment_failed',
    })

    expect(
      parseCheckoutPaymentErrorSearch({
        payment_error: '   ',
        payment_error_code: 'unexpected_gateway_code',
      }),
    ).toEqual({
      payment_error: undefined,
      payment_error_code: undefined,
    })
  })
})
