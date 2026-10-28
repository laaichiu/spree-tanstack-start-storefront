import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutReadyStateErrors } from './use-checkout-ready-state-errors'

function createOptions(checkoutContextKey: string) {
  return {
    checkoutContextKey,
    initialPaymentError: null,
    initialPaymentErrorCode: null,
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    scrollToCheckoutSection: vi.fn(),
    t: (key: string) => key,
  }
}

afterEach(() => {
  cleanup()
})

describe('checkout ready-state error lifecycle', () => {
  it('clears errors when the checkout context changes', () => {
    const { result, rerender } = renderHook(
      ({ checkoutContextKey }: { checkoutContextKey: string }) =>
        useCheckoutReadyStateErrors(createOptions(checkoutContextKey)),
      { initialProps: { checkoutContextKey: 'cart_123:us:en' } },
    )

    act(() => {
      result.current.setCheckoutError('old checkout error')
      result.current.setSingleCheckoutSectionError(
        'payment',
        'old payment error',
      )
    })

    expect(result.current.checkoutError).toBe('old checkout error')
    expect(result.current.sectionErrors).toEqual({
      payment: ['old payment error'],
    })

    rerender({ checkoutContextKey: 'cart_123:ca:en-CA' })

    expect(result.current.checkoutError).toBeNull()
    expect(result.current.sectionErrors).toEqual({})
  })

  it('contains a rejected payment-error navigation', async () => {
    let rejectNavigation: (reason?: unknown) => void = () => undefined
    const navigation = new Promise<void>((_, reject) => {
      rejectNavigation = reject
    })
    const navigateToCheckout = vi.fn().mockReturnValue(navigation)

    renderHook(() =>
      useCheckoutReadyStateErrors({
        ...createOptions('cart_123:us:en'),
        initialPaymentError: 'Payment failed',
        navigateToCheckout,
      }),
    )

    expect(navigateToCheckout).toHaveBeenCalledOnce()

    await act(async () => {
      rejectNavigation(new Error('navigation failed'))
      await navigation.catch(() => undefined)
    })

    expect(navigateToCheckout).toHaveBeenCalledOnce()
  })

  it('can apply the same payment error again after the search is cleared', () => {
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const initialProps: { initialPaymentError: string | null } = {
      initialPaymentError: 'Payment failed',
    }
    const { rerender } = renderHook(
      ({ initialPaymentError }: { initialPaymentError: string | null }) =>
        useCheckoutReadyStateErrors({
          ...createOptions('cart_123:us:en'),
          initialPaymentError,
          navigateToCheckout,
        }),
      { initialProps },
    )

    expect(navigateToCheckout).toHaveBeenCalledOnce()

    rerender({ initialPaymentError: null })
    rerender({ initialPaymentError: 'Payment failed' })

    expect(navigateToCheckout).toHaveBeenCalledTimes(2)
  })
})
