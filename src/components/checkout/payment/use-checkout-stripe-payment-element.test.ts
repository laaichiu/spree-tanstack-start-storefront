import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { useCheckoutStripePaymentElement } from './use-checkout-stripe-payment-element'

afterEach(() => {
  cleanup()
})

function stripeHandle(): StripePaymentElementHandle {
  return {
    confirmPayment: vi.fn(),
    fetchUpdates: vi.fn(),
  }
}

describe('useCheckoutStripePaymentElement', () => {
  it('tracks Stripe element readiness, completion, and handle', () => {
    const { result } = renderHook(() => useCheckoutStripePaymentElement())
    const handle = stripeHandle()

    expect(result.current.isStripeElementReady).toBe(false)
    expect(result.current.isStripeElementComplete).toBe(false)
    expect(result.current.stripePaymentHandleRef.current).toBeNull()

    act(() => {
      result.current.handleStripeElementReady()
      result.current.handleStripeElementCompleteChange(true)
      result.current.handleStripeReady(handle)
    })

    expect(result.current.isStripeElementReady).toBe(true)
    expect(result.current.isStripeElementComplete).toBe(true)
    expect(result.current.stripePaymentHandleRef.current).toBe(handle)
  })

  it('resets Stripe element state and handle', () => {
    const { result } = renderHook(() => useCheckoutStripePaymentElement())

    act(() => {
      result.current.handleStripeElementReady()
      result.current.handleStripeElementCompleteChange(true)
      result.current.handleStripeReady(stripeHandle())
    })

    act(() => {
      result.current.resetStripePaymentElement()
    })

    expect(result.current.isStripeElementReady).toBe(false)
    expect(result.current.isStripeElementComplete).toBe(false)
    expect(result.current.stripePaymentHandleRef.current).toBeNull()
  })
})
