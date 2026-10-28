import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Dispatch, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutRequirementSection } from '@/lib/checkout/contracts'

import { useCheckoutSubmitAction } from './use-checkout-submit-action'

const runSubmitFlow = vi.hoisted(() => vi.fn())

vi.mock('../../utils/completion/checkout-submit-flow', () => ({
  runCheckoutSubmitFlow: runSubmitFlow,
}))

function createOptions({
  checkoutContextKey,
  setCheckoutError,
  setIsCheckoutSubmitting,
  setSingleCheckoutSectionError,
}: {
  checkoutContextKey: string
  setCheckoutError: (error: string | null) => void
  setIsCheckoutSubmitting: Dispatch<SetStateAction<boolean>>
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
}) {
  return {
    actions: {
      setCheckoutError,
      setCheckoutSectionErrorsAndScroll: vi.fn(),
      setSingleCheckoutSectionError,
    },
    checkoutContextKey,
    pendingPaymentShippingRateRef: {
      current: null,
    } as { current: CartShippingRate | null },
    preparePaymentSubmission: vi.fn(),
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    t: (key: string) => key,
    runtime: {
      clearAutoSaveAddressTimeout: vi.fn(),
      setIsCheckoutSubmitting,
      setPendingPaymentSubmitKey: vi.fn(),
    },
    submitRenderedPayment: vi.fn().mockResolvedValue(undefined),
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout submit action', () => {
  it('releases an old context guard and ignores its rejection after a transition', async () => {
    let rejectFirst: (error: Error) => void = () => undefined
    const firstSubmission = new Promise<void>((_, reject) => {
      rejectFirst = reject
    })
    runSubmitFlow
      .mockReturnValueOnce(firstSubmission)
      .mockResolvedValueOnce(undefined)
    const setCheckoutError = vi.fn()
    const setIsCheckoutSubmitting = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const options = createOptions({
      checkoutContextKey: 'checkout:us:en:cart-1',
      setCheckoutError,
      setIsCheckoutSubmitting,
      setSingleCheckoutSectionError,
    })
    const { result, rerender } = renderHook(
      ({ checkoutContextKey }: { checkoutContextKey: string }) =>
        useCheckoutSubmitAction({
          ...options,
          checkoutContextKey,
        }),
      { initialProps: { checkoutContextKey: options.checkoutContextKey } },
    )

    let firstRequest: Promise<void> | undefined
    act(() => {
      firstRequest = result.current()
    })

    rerender({ checkoutContextKey: 'checkout:ca:en-CA:cart-2' })

    let secondRequest: Promise<void> | undefined
    act(() => {
      secondRequest = result.current()
    })

    await act(async () => {
      rejectFirst(new Error('old checkout submit failed'))
      await firstRequest
      await secondRequest
    })

    expect(runSubmitFlow).toHaveBeenCalledTimes(2)
    expect(setCheckoutError).toHaveBeenCalledTimes(2)
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })
})
