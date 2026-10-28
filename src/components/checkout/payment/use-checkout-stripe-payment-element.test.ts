// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { afterEach, describe, expect, it } from 'vitest'

import { useCheckoutStripePaymentElement } from './use-checkout-stripe-payment-element'

const firstHandle = {} as StripePaymentElementHandle

afterEach(cleanup)

describe('checkout Stripe Payment Element ownership', () => {
  it('does not carry readiness, completeness, or the handle into a new owner', () => {
    const { result, rerender } = renderHook(
      ({ ownerKey }: { ownerKey: string }) =>
        useCheckoutStripePaymentElement({ ownerKey }),
      { initialProps: { ownerKey: 'cart-first:us:en' } },
    )

    act(() => {
      result.current.handleStripeElementReady()
      result.current.handleStripeElementCompleteChange(true)
      result.current.handleStripeReady(firstHandle)
    })

    expect(result.current.isStripeElementReady).toBe(true)
    expect(result.current.isStripeElementComplete).toBe(true)
    expect(result.current.stripePaymentHandleRef.current).toBe(firstHandle)

    rerender({ ownerKey: 'cart-second:ca:en-CA' })

    expect(result.current.isStripeElementReady).toBe(false)
    expect(result.current.isStripeElementComplete).toBe(false)
    expect(result.current.stripePaymentHandleRef.current).toBeNull()
  })

  it('clears the current element state when the payment session resets', () => {
    const { result } = renderHook(() =>
      useCheckoutStripePaymentElement({ ownerKey: 'cart-first:us:en' }),
    )

    act(() => {
      result.current.handleStripeElementReady()
      result.current.handleStripeElementCompleteChange(true)
      result.current.handleStripeReady(firstHandle)
      result.current.resetStripePaymentElement()
    })

    expect(result.current.isStripeElementReady).toBe(false)
    expect(result.current.isStripeElementComplete).toBe(false)
    expect(result.current.stripePaymentHandleRef.current).toBeNull()
  })
})
