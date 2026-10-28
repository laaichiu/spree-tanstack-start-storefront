// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'
import { useCheckoutPaymentSessionState } from './use-checkout-payment-session-state'

const paymentSession: CheckoutPaymentSession = {
  id: 'ps_current',
  providerData: { clientSecret: 'secret_current' },
  status: 'pending',
}

afterEach(cleanup)

describe('checkout payment-session state ownership', () => {
  it('does not project the previous owner session into the next context', () => {
    const { result, rerender } = renderHook(
      ({ ownerKey }: { ownerKey: string }) =>
        useCheckoutPaymentSessionState({
          onResetStripeElement: vi.fn(),
          ownerKey,
        }),
      { initialProps: { ownerKey: 'cart_first:us:en:session_first' } },
    )
    const oldSetPaymentSession = result.current.setPaymentSession
    const oldSetPaymentError = result.current.setPaymentError

    act(() => {
      oldSetPaymentSession(paymentSession)
      oldSetPaymentError('old payment error')
    })

    expect(result.current.paymentSession).toEqual(paymentSession)
    expect(result.current.clientSecret).toBe('secret_current')
    expect(result.current.paymentError).toBe('old payment error')

    rerender({ ownerKey: 'cart_second:ca:en-CA:session_second' })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.clientSecret).toBeUndefined()
    expect(result.current.paymentError).toBeNull()

    act(() => {
      oldSetPaymentSession(paymentSession)
      oldSetPaymentError('stale payment error')
    })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.paymentError).toBeNull()

    act(() => {
      result.current.setPaymentSession(paymentSession)
    })

    expect(result.current.paymentSession).toEqual(paymentSession)
  })

  it('does not resurrect or accept callbacks from an owner after a context round trip', () => {
    const firstOwner = 'cart_first:us:en:session_first'
    const { result, rerender } = renderHook(
      ({ ownerKey }: { ownerKey: string }) =>
        useCheckoutPaymentSessionState({
          onResetStripeElement: vi.fn(),
          ownerKey,
        }),
      { initialProps: { ownerKey: firstOwner } },
    )
    const oldSetPaymentSession = result.current.setPaymentSession

    act(() => {
      oldSetPaymentSession(paymentSession)
    })

    rerender({ ownerKey: 'cart_second:ca:en-CA:session_second' })
    rerender({ ownerKey: firstOwner })

    expect(result.current.paymentSession).toBeNull()
    expect(result.current.clientSecret).toBeUndefined()

    act(() => {
      oldSetPaymentSession({ ...paymentSession, id: 'ps_stale' })
    })

    expect(result.current.paymentSession).toBeNull()

    act(() => {
      result.current.setPaymentSession(paymentSession)
    })

    expect(result.current.paymentSession).toEqual(paymentSession)
  })
})
