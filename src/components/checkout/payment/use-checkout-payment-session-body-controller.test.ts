// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutPaymentSessionBodyController } from './use-checkout-payment-session-body-controller'

function createOptions(clientSecret: string) {
  return {
    clientSecret,
    disabled: false,
    isBusy: false,
    onStripeElementCompleteChange: vi.fn(),
    onStripeElementReady: vi.fn(),
    onStripeReady: vi.fn(),
    paymentSession: null,
    selectedSavedPaymentProfileId: null,
  }
}

afterEach(cleanup)

describe('checkout payment-session body owner lifecycle', () => {
  it('ignores a late ready event from the previous payment element owner', () => {
    const initialOptions = createOptions('secret-first')
    const { result, rerender } = renderHook(
      (options) => useCheckoutPaymentSessionBodyController(options),
      { initialProps: initialOptions },
    )
    const oldReadyHandler = result.current.handleStripeElementReady

    act(() => {
      oldReadyHandler()
    })

    expect(result.current.isStripePaymentElementReady).toBe(true)
    expect(initialOptions.onStripeElementReady).toHaveBeenCalledOnce()

    const nextOptions = createOptions('secret-second')
    rerender(nextOptions)

    expect(result.current.isStripePaymentElementReady).toBe(false)

    act(() => {
      oldReadyHandler()
    })

    expect(result.current.isStripePaymentElementReady).toBe(false)
    expect(nextOptions.onStripeElementReady).not.toHaveBeenCalled()

    act(() => {
      result.current.handleStripeElementReady()
    })

    expect(result.current.isStripePaymentElementReady).toBe(true)
    expect(nextOptions.onStripeElementReady).toHaveBeenCalledOnce()
  })

  it('ignores late complete and handle events from the previous payment element owner', () => {
    const initialOptions = createOptions('secret-first')
    const { result, rerender } = renderHook(
      (options) => useCheckoutPaymentSessionBodyController(options),
      { initialProps: initialOptions },
    )
    const oldCompleteHandler = result.current.handleStripeElementCompleteChange
    const oldReadyHandler = result.current.handleStripeReady

    rerender(createOptions('secret-second'))

    act(() => {
      oldCompleteHandler(true)
      oldReadyHandler({} as StripePaymentElementHandle)
    })

    expect(initialOptions.onStripeElementCompleteChange).not.toHaveBeenCalled()
    expect(initialOptions.onStripeReady).not.toHaveBeenCalled()
  })
})
