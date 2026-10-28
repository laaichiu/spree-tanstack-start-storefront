// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutCompletionResult } from '../utils/completion/checkout-completion-contract'
import type { CheckoutPaymentReturnSearch } from '../utils/completion/payment-return'
import { useConfirmPaymentReturnController } from './use-confirm-payment-return-controller'

const confirmPayment = vi.hoisted(() => vi.fn())

vi.mock('./use-confirm-checkout-payment', () => ({
  useConfirmCheckoutPayment: () => ({ confirmPayment }),
}))

const market = {
  country: 'us',
  locale: 'en',
}
const success: CheckoutCompletionResult = {
  order: null,
  success: true,
}

function createNavigation() {
  return {
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    navigateToOrderPlaced: vi.fn().mockResolvedValue(undefined),
  }
}

function renderController(
  paymentReturn: CheckoutPaymentReturnSearch,
  navigationOverrides: Partial<ReturnType<typeof createNavigation>> = {},
) {
  const navigate = { ...createNavigation(), ...navigationOverrides }

  const hook = renderHook(
    (currentPaymentReturn) =>
      useConfirmPaymentReturnController({
        cartId: 'cart_123',
        country: market.country,
        locale: market.locale,
        navigate,
        paymentReturn: currentPaymentReturn,
        t: () => 'message',
      }),
    { initialProps: paymentReturn },
  )

  return { ...hook, navigate }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('confirm payment return controller', () => {
  it('processes a new provider return payload on the same route instance', async () => {
    let resolveFirst: (result: CheckoutCompletionResult) => void = () =>
      undefined
    let resolveSecond: (result: CheckoutCompletionResult) => void = () =>
      undefined
    const firstConfirmation = new Promise<CheckoutCompletionResult>(
      (resolve) => {
        resolveFirst = resolve
      },
    )
    const secondConfirmation = new Promise<CheckoutCompletionResult>(
      (resolve) => {
        resolveSecond = resolve
      },
    )
    confirmPayment
      .mockReturnValueOnce(firstConfirmation)
      .mockReturnValueOnce(secondConfirmation)

    const { navigate, rerender } = renderController({ session: 'ps_first' })

    expect(confirmPayment).toHaveBeenCalledOnce()

    rerender({ session: 'ps_second' })

    expect(confirmPayment).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveFirst(success)
      await firstConfirmation
    })

    expect(navigate.navigateToOrderPlaced).not.toHaveBeenCalled()

    await act(async () => {
      resolveSecond(success)
      await secondConfirmation
    })

    expect(navigate.navigateToOrderPlaced).toHaveBeenCalledOnce()
    expect(navigate.navigateToOrderPlaced).toHaveBeenCalledWith({
      kind: 'order_placed',
      params: {
        country: market.country,
        id: 'cart_123',
        locale: market.locale,
      },
      to: '/$country/$locale/order-placed/$id',
    })
  })

  it('does not repeat the same provider return payload after rerender', () => {
    const { rerender } = renderController({ session: 'ps_same' })

    rerender({ session: 'ps_same' })

    expect(confirmPayment).toHaveBeenCalledOnce()
  })

  it('does not retry successful confirmation through checkout when order navigation fails', async () => {
    confirmPayment.mockResolvedValueOnce(success)
    const navigationError = new Error('order navigation failed')
    const navigateToOrderPlaced = vi.fn().mockRejectedValueOnce(navigationError)
    const { navigate, result } = renderController(
      { session: 'ps_123' },
      { navigateToOrderPlaced },
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(navigate.navigateToOrderPlaced).toHaveBeenCalledOnce()
    expect(navigate.navigateToCheckout).not.toHaveBeenCalled()
    expect(result.current).toBe('message')
  })

  it('clears an old navigation error when a new provider return starts', async () => {
    confirmPayment.mockResolvedValueOnce(success)
    const navigateToOrderPlaced = vi
      .fn()
      .mockRejectedValueOnce(new Error('order navigation failed'))
    const { result, navigate, rerender } = renderController(
      { session: 'ps_first' },
      { navigateToOrderPlaced },
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current).toBe('message')

    let resolveSecond: (result: CheckoutCompletionResult) => void = () =>
      undefined
    const secondConfirmation = new Promise<CheckoutCompletionResult>(
      (resolve) => {
        resolveSecond = resolve
      },
    )
    confirmPayment.mockReturnValueOnce(secondConfirmation)

    rerender({ session: 'ps_second' })

    expect(result.current).toBeNull()

    await act(async () => {
      resolveSecond(success)
      await secondConfirmation
    })

    expect(navigate.navigateToOrderPlaced).toHaveBeenCalledTimes(2)
  })
})
