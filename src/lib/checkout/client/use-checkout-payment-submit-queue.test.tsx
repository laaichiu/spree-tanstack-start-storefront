import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { getCheckoutPaymentStateKey } from '@/lib/checkout/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { useCheckoutPaymentSubmitQueue } from './use-checkout-payment-submit-queue'

const checkoutOrder = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const market = {
  country: 'us',
  locale: 'en',
} satisfies Pick<MarketSelectionInput, 'country' | 'locale'>
const nextMarket = {
  country: 'ca',
  locale: 'en-CA',
} satisfies Pick<MarketSelectionInput, 'country' | 'locale'>

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout payment submit queue', () => {
  it('keeps a queued payment intent while the cart reaches its expected state', async () => {
    const paymentStateKey = getCheckoutPaymentStateKey(checkoutOrder)
    const nextPaymentStateKey = `${paymentStateKey}:next`
    const submitRenderedPayment = vi.fn().mockResolvedValue(undefined)
    const setPendingPaymentSubmitKey = vi.fn()
    const { rerender } = renderHook(
      ({ activePaymentStateKey }: { activePaymentStateKey: string }) =>
        useCheckoutPaymentSubmitQueue({
          canAttemptPaymentSubmit: true,
          cart: checkoutOrder,
          market,
          hasSelectedShippingRate: true,
          isCheckoutPending: false,
          isPaymentBusy: false,
          isPaymentSetupPending: false,
          isShippingPending: false,
          paymentStateKey: activePaymentStateKey,
          pendingPaymentShippingRateRef: { current: null },
          pendingPaymentSubmitKey: nextPaymentStateKey,
          selectShippingRate: vi.fn(),
          setCheckoutError: vi.fn(),
          setPendingPaymentSubmitKey,
          setSingleCheckoutSectionError: vi.fn(),
          submitRenderedPayment,
          t: () => 'Payment submission failed.',
        }),
      { initialProps: { activePaymentStateKey: paymentStateKey } },
    )

    expect(submitRenderedPayment).not.toHaveBeenCalled()
    rerender({ activePaymentStateKey: nextPaymentStateKey })

    await waitFor(() => expect(submitRenderedPayment).toHaveBeenCalledOnce())
    expect(setPendingPaymentSubmitKey).toHaveBeenCalledWith(null)
  })

  it('clears a queued payment intent replaced by a newer same-cart state', async () => {
    const paymentStateKey = getCheckoutPaymentStateKey(checkoutOrder)
    const nextPaymentStateKey = `${paymentStateKey}:next`
    const newerPaymentStateKey = `${paymentStateKey}:newer`
    const submitRenderedPayment = vi.fn().mockResolvedValue(undefined)
    const setPendingPaymentSubmitKey = vi.fn()
    const { rerender } = renderHook(
      ({ activePaymentStateKey }: { activePaymentStateKey: string }) =>
        useCheckoutPaymentSubmitQueue({
          canAttemptPaymentSubmit: true,
          cart: checkoutOrder,
          market,
          hasSelectedShippingRate: true,
          isCheckoutPending: false,
          isPaymentBusy: false,
          isPaymentSetupPending: false,
          isShippingPending: false,
          paymentStateKey: activePaymentStateKey,
          pendingPaymentShippingRateRef: { current: null },
          pendingPaymentSubmitKey: nextPaymentStateKey,
          selectShippingRate: vi.fn(),
          setCheckoutError: vi.fn(),
          setPendingPaymentSubmitKey,
          setSingleCheckoutSectionError: vi.fn(),
          submitRenderedPayment,
          t: () => 'Payment submission failed.',
        }),
      { initialProps: { activePaymentStateKey: paymentStateKey } },
    )

    rerender({ activePaymentStateKey: newerPaymentStateKey })

    await waitFor(() =>
      expect(setPendingPaymentSubmitKey).toHaveBeenCalledWith(null),
    )
    expect(submitRenderedPayment).not.toHaveBeenCalled()
  })

  it('ignores a queued shipping rejection after a same-cart state transition', async () => {
    let rejectSelection: (error: Error) => void = () => undefined
    const selection = new Promise<CheckoutOrder>((_, reject) => {
      rejectSelection = reject
    })
    const paymentStateKey = getCheckoutPaymentStateKey(checkoutOrder)
    const nextPaymentStateKey = `${paymentStateKey}:next`
    const newerPaymentStateKey = `${paymentStateKey}:newer`
    const pendingPaymentShippingRateRef = {
      current: checkoutOrder.shippingRates[0],
    }
    const selectShippingRate = vi.fn(() => selection)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { rerender } = renderHook(
      ({ activePaymentStateKey }: { activePaymentStateKey: string }) =>
        useCheckoutPaymentSubmitQueue({
          canAttemptPaymentSubmit: true,
          cart: checkoutOrder,
          market,
          hasSelectedShippingRate: false,
          isCheckoutPending: false,
          isPaymentBusy: false,
          isPaymentSetupPending: false,
          isShippingPending: false,
          paymentStateKey: activePaymentStateKey,
          pendingPaymentShippingRateRef,
          pendingPaymentSubmitKey: nextPaymentStateKey,
          selectShippingRate,
          setCheckoutError,
          setPendingPaymentSubmitKey: vi.fn(),
          setSingleCheckoutSectionError,
          submitRenderedPayment: vi.fn().mockResolvedValue(undefined),
          t: () => 'Shipping method save failed.',
        }),
      { initialProps: { activePaymentStateKey: paymentStateKey } },
    )

    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledOnce())
    rerender({ activePaymentStateKey: newerPaymentStateKey })

    await act(async () => {
      rejectSelection(new Error('old shipping selection failed'))
      await selection.catch(() => undefined)
    })

    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('ignores a queued shipping rejection after unmount', async () => {
    let rejectSelection: (error: Error) => void = () => undefined
    const selection = new Promise<CheckoutOrder>((_, reject) => {
      rejectSelection = reject
    })
    const selectShippingRate = vi.fn(() => selection)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { unmount } = renderHook(() =>
      useCheckoutPaymentSubmitQueue({
        canAttemptPaymentSubmit: true,
        cart: checkoutOrder,
        market,
        hasSelectedShippingRate: false,
        isCheckoutPending: false,
        isPaymentBusy: false,
        isPaymentSetupPending: false,
        isShippingPending: false,
        paymentStateKey: getCheckoutPaymentStateKey(checkoutOrder),
        pendingPaymentShippingRateRef: {
          current: checkoutOrder.shippingRates[0],
        },
        pendingPaymentSubmitKey: getCheckoutPaymentStateKey(checkoutOrder),
        selectShippingRate,
        setCheckoutError,
        setPendingPaymentSubmitKey: vi.fn(),
        setSingleCheckoutSectionError,
        submitRenderedPayment: vi.fn().mockResolvedValue(undefined),
        t: () => 'Shipping method save failed.',
      }),
    )

    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledOnce())
    unmount()

    await act(async () => {
      rejectSelection(new Error('old shipping selection failed'))
      await selection.catch(() => undefined)
    })

    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('maps an automatic payment rejection to the payment error boundary', async () => {
    const setCheckoutError = vi.fn()
    const setPendingPaymentSubmitKey = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const submitRenderedPayment = vi
      .fn()
      .mockRejectedValue(new Error('payment submission unavailable'))

    renderHook(() =>
      useCheckoutPaymentSubmitQueue({
        canAttemptPaymentSubmit: true,
        cart: checkoutOrder,
        market,
        hasSelectedShippingRate: true,
        isCheckoutPending: false,
        isPaymentBusy: false,
        isPaymentSetupPending: false,
        isShippingPending: false,
        paymentStateKey: getCheckoutPaymentStateKey(checkoutOrder),
        pendingPaymentShippingRateRef: { current: null },
        pendingPaymentSubmitKey: getCheckoutPaymentStateKey(checkoutOrder),
        selectShippingRate: vi.fn(),
        setCheckoutError,
        setPendingPaymentSubmitKey,
        setSingleCheckoutSectionError,
        submitRenderedPayment,
        t: () => 'Payment submission failed.',
      }),
    )

    await waitFor(() => expect(submitRenderedPayment).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(setCheckoutError).toHaveBeenCalledWith(
        'payment submission unavailable',
      ),
    )

    expect(setPendingPaymentSubmitKey).toHaveBeenCalledWith(null)
    expect(setSingleCheckoutSectionError).toHaveBeenCalledWith(
      'payment',
      'payment submission unavailable',
    )
  })

  it('clears an old pending payment intent before a market transition can consume it', async () => {
    const submitRenderedPayment = vi.fn().mockResolvedValue(undefined)
    const setPendingPaymentSubmitKey = vi.fn()
    const { rerender } = renderHook(
      ({
        activeMarket,
        isCheckoutPending,
      }: {
        activeMarket: typeof market
        isCheckoutPending: boolean
      }) =>
        useCheckoutPaymentSubmitQueue({
          canAttemptPaymentSubmit: true,
          cart: checkoutOrder,
          market: activeMarket,
          hasSelectedShippingRate: true,
          isCheckoutPending,
          isPaymentBusy: false,
          isPaymentSetupPending: false,
          isShippingPending: false,
          paymentStateKey: getCheckoutPaymentStateKey(checkoutOrder),
          pendingPaymentShippingRateRef: { current: null },
          pendingPaymentSubmitKey: getCheckoutPaymentStateKey(checkoutOrder),
          selectShippingRate: vi.fn(),
          setCheckoutError: vi.fn(),
          setPendingPaymentSubmitKey,
          setSingleCheckoutSectionError: vi.fn(),
          submitRenderedPayment,
          t: () => 'Payment submission failed.',
        }),
      { initialProps: { activeMarket: market, isCheckoutPending: true } },
    )

    rerender({ activeMarket: nextMarket, isCheckoutPending: false })

    await waitFor(() =>
      expect(setPendingPaymentSubmitKey).toHaveBeenCalledWith(null),
    )
    expect(submitRenderedPayment).not.toHaveBeenCalled()
  })

  it('ignores a queued payment rejection from the previous market', async () => {
    let rejectSubmission: (error: Error) => void = () => undefined
    const submission = new Promise<void>((_, reject) => {
      rejectSubmission = reject
    })
    const submitRenderedPayment = vi.fn().mockReturnValue(submission)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { rerender } = renderHook(
      ({ activeMarket }: { activeMarket: typeof market }) =>
        useCheckoutPaymentSubmitQueue({
          canAttemptPaymentSubmit: true,
          cart: checkoutOrder,
          market: activeMarket,
          hasSelectedShippingRate: true,
          isCheckoutPending: false,
          isPaymentBusy: false,
          isPaymentSetupPending: false,
          isShippingPending: false,
          paymentStateKey: getCheckoutPaymentStateKey(checkoutOrder),
          pendingPaymentShippingRateRef: { current: null },
          pendingPaymentSubmitKey: getCheckoutPaymentStateKey(checkoutOrder),
          selectShippingRate: vi.fn(),
          setCheckoutError,
          setPendingPaymentSubmitKey: vi.fn(),
          setSingleCheckoutSectionError,
          submitRenderedPayment,
          t: () => 'Payment submission failed.',
        }),
      { initialProps: { activeMarket: market } },
    )

    await waitFor(() => expect(submitRenderedPayment).toHaveBeenCalledOnce())
    rerender({ activeMarket: nextMarket })

    await act(async () => {
      rejectSubmission(new Error('old payment submission failed'))
      await submission.catch(() => undefined)
    })

    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })
})
