// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  isCompletedCheckoutOrder,
  isRecoverableCheckoutCompletionError,
  isSpreeCompletedOrder,
  readCheckoutErrorCode,
  readCheckoutErrorStatus,
} from './payment-completion'

describe('payment completion recovery', () => {
  it('reads only numeric Spree status values', () => {
    expect(
      readCheckoutErrorStatus(
        Object.assign(new Error('Locked'), { status: 422 }),
      ),
    ).toBe(422)
    expect(readCheckoutErrorStatus({ status: '422' })).toBeUndefined()
    expect(readCheckoutErrorStatus(null)).toBeUndefined()
  })

  it('reads only non-empty Spree error codes', () => {
    expect(readCheckoutErrorCode({ code: 'completion_in_progress' })).toBe(
      'completion_in_progress',
    )
    expect(readCheckoutErrorCode({ code: '  ' })).toBeUndefined()
    expect(readCheckoutErrorCode({ code: 409 })).toBeUndefined()
  })

  it('recovers from explicit complete-boundary authorization and state conflicts', () => {
    expect(isRecoverableCheckoutCompletionError({ status: 403 })).toBe(true)
    expect(isRecoverableCheckoutCompletionError({ status: 422 })).toBe(true)
    expect(
      isRecoverableCheckoutCompletionError({
        code: 'completion_in_progress',
        status: 409,
      }),
    ).toBe(true)
    expect(
      isRecoverableCheckoutCompletionError({
        code: 'cart_already_updated',
        status: 409,
      }),
    ).toBe(true)
    expect(isRecoverableCheckoutCompletionError({ status: 409 })).toBe(false)
    expect(
      isRecoverableCheckoutCompletionError({
        code: 'validation_failed',
        status: 409,
      }),
    ).toBe(false)
    expect(isRecoverableCheckoutCompletionError({ status: 400 })).toBe(false)
    expect(isRecoverableCheckoutCompletionError({ status: 500 })).toBe(false)
  })

  it('requires a non-empty completed timestamp before accepting a recovered order', () => {
    expect(
      isSpreeCompletedOrder({ completed_at: '2026-06-16T11:30:00Z' }),
    ).toBe(true)
    expect(isSpreeCompletedOrder({ completed_at: '' })).toBe(false)
    expect(isSpreeCompletedOrder({ completed_at: null })).toBe(false)
    expect(isSpreeCompletedOrder({})).toBe(false)
    expect(isSpreeCompletedOrder(null)).toBe(false)
  })

  it('recognizes completed checkout orders returned through the order serializer', () => {
    expect(
      isCompletedCheckoutOrder({
        completedAt: '2026-06-16T11:30:00Z',
        currentStep: null,
      }),
    ).toBe(true)
    expect(isCompletedCheckoutOrder({ currentStep: 'complete' })).toBe(true)
    expect(
      isCompletedCheckoutOrder({ completedAt: null, currentStep: null }),
    ).toBe(false)
  })
})
