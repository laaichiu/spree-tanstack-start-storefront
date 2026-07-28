import { describe, expect, it } from 'vitest'

import {
  isRecoverableCheckoutCompletionStatus,
  isSpreeCompletedOrder,
  readCheckoutErrorStatus,
} from './payment-completion'

describe('checkout payment completion helpers', () => {
  it('reads Spree error status values from error-like objects', () => {
    expect(
      readCheckoutErrorStatus(
        Object.assign(new Error('Locked'), { status: 422 }),
      ),
    ).toBe(422)
    expect(readCheckoutErrorStatus({ status: 403 })).toBe(403)
    expect(readCheckoutErrorStatus({ status: '422' })).toBeUndefined()
    expect(readCheckoutErrorStatus(new Error('No status'))).toBeUndefined()
    expect(readCheckoutErrorStatus(null)).toBeUndefined()
  })

  it('treats only Spree complete-boundary conflicts as recoverable', () => {
    expect(isRecoverableCheckoutCompletionStatus(403)).toBe(true)
    expect(isRecoverableCheckoutCompletionStatus(422)).toBe(true)
    expect(isRecoverableCheckoutCompletionStatus(400)).toBe(false)
    expect(isRecoverableCheckoutCompletionStatus(500)).toBe(false)
    expect(isRecoverableCheckoutCompletionStatus(undefined)).toBe(false)
  })

  it('requires completed_at before treating an order lookup as complete', () => {
    expect(
      isSpreeCompletedOrder({
        completed_at: '2026-06-16T11:30:00Z',
      }),
    ).toBe(true)
    expect(isSpreeCompletedOrder({ completed_at: '' })).toBe(false)
    expect(isSpreeCompletedOrder({ completed_at: null })).toBe(false)
    expect(isSpreeCompletedOrder({})).toBe(false)
    expect(isSpreeCompletedOrder(null)).toBe(false)
  })
})
