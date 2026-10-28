import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import type { MarketSelectionInput } from '@/lib/core/market'

import { useCheckoutReadyStateErrors } from './use-checkout-ready-state-errors'
import { useCheckoutShippingRateEffects } from './use-checkout-shipping-rate-effects'

const firstCart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const secondCart = {
  ...firstCart,
  id: 'cart-2',
}
const firstMarket = {
  country: 'us',
  locale: 'en',
} satisfies Pick<MarketSelectionInput, 'country' | 'locale'>
const secondMarket = {
  country: 'ca',
  locale: 'en-CA',
} satisfies Pick<MarketSelectionInput, 'country' | 'locale'>

function createOptions({
  cart,
  market,
  lastEnsuredShippingRateForPaymentKeyRef,
  pendingPaymentShippingRateRef,
  selectShippingRate,
  markShippingRatesCurrent = vi.fn(),
  setCheckoutError = vi.fn(),
  setPendingPaymentSubmitKey = vi.fn(),
  setSingleCheckoutSectionError = vi.fn(),
}: {
  cart: CheckoutOrder
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
  markShippingRatesCurrent?: () => void
  setCheckoutError?: (error: string | null) => void
  setPendingPaymentSubmitKey?: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError?: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
}) {
  return {
    cart,
    hasCurrentShippingSelection: true,
    isAddressPending: false,
    isCheckoutSubmitting: false,
    isShippingPending: false,
    lastEnsuredShippingRateForPaymentKeyRef,
    market,
    markShippingRatesCurrent,
    paymentStateKey: `${cart.id}:payment`,
    pendingPaymentShippingRateRef,
    resetShippingRatesStale: vi.fn(),
    selectedShippingRate: cart.shippingRates[0],
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    t: (key: string) => key,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout shipping-rate effects', () => {
  it('keeps an automatic ensure alive across unrelated checkout rerenders', async () => {
    let resolveEnsure: (cart: CheckoutOrder) => void = () => undefined
    const ensure = new Promise<CheckoutOrder>((resolve) => {
      resolveEnsure = resolve
    })
    const selectShippingRate = vi
      .fn<(rate: CartShippingRate) => Promise<CheckoutOrder>>()
      .mockReturnValue(ensure)
    const markShippingRatesCurrent = vi.fn()
    const lastEnsuredShippingRateForPaymentKeyRef = {
      current: null,
    } as MutableRefObject<string | null>
    const pendingPaymentShippingRateRef = {
      current: null,
    } as MutableRefObject<CartShippingRate | null>
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const scrollToCheckoutSection = vi.fn()
    const resetShippingRatesStale = vi.fn()
    const setPendingPaymentSubmitKey = vi.fn()
    const translate = (key: string) => key

    const { rerender } = renderHook(
      ({ revision }: { revision: number }) => {
        const errors = useCheckoutReadyStateErrors({
          checkoutContextKey: `checkout:${revision === 0 ? 'stable' : 'stable'}`,
          initialPaymentError: null,
          initialPaymentErrorCode: null,
          navigateToCheckout,
          scrollToCheckoutSection,
          t: translate,
        })

        useCheckoutShippingRateEffects({
          cart: firstCart,
          hasCurrentShippingSelection: true,
          isAddressPending: false,
          isCheckoutSubmitting: false,
          isShippingPending: false,
          lastEnsuredShippingRateForPaymentKeyRef,
          market: firstMarket,
          markShippingRatesCurrent,
          paymentStateKey: `${firstCart.id}:payment`,
          pendingPaymentShippingRateRef,
          resetShippingRatesStale,
          selectedShippingRate: firstCart.shippingRates[0],
          selectShippingRate,
          setCheckoutError: errors.setCheckoutError,
          setPendingPaymentSubmitKey,
          setSingleCheckoutSectionError: errors.setSingleCheckoutSectionError,
          t: translate,
        })
      },
      { initialProps: { revision: 0 } },
    )

    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledOnce())

    rerender({ revision: 1 })

    await act(async () => {
      resolveEnsure(firstCart)
      await ensure
    })

    expect(markShippingRatesCurrent).toHaveBeenCalledOnce()
  })

  it('ignores an old ensure success after the checkout cart changes', async () => {
    let resolveFirst: (cart: CheckoutOrder) => void = () => undefined
    let resolveSecond: (cart: CheckoutOrder) => void = () => undefined
    const firstEnsure = new Promise<CheckoutOrder>((resolve) => {
      resolveFirst = resolve
    })
    const secondEnsure = new Promise<CheckoutOrder>((resolve) => {
      resolveSecond = resolve
    })
    const selectShippingRate = vi
      .fn<(rate: CartShippingRate) => Promise<CheckoutOrder>>()
      .mockReturnValueOnce(firstEnsure)
      .mockReturnValueOnce(secondEnsure)
    const markShippingRatesCurrent = vi.fn()
    const lastEnsuredShippingRateForPaymentKeyRef = {
      current: null,
    } as MutableRefObject<string | null>
    const pendingPaymentShippingRateRef = {
      current: null,
    } as MutableRefObject<CartShippingRate | null>

    const { rerender } = renderHook(
      ({
        cart,
        market,
      }: {
        cart: CheckoutOrder
        market: Pick<MarketSelectionInput, 'country' | 'locale'>
      }) =>
        useCheckoutShippingRateEffects(
          createOptions({
            cart,
            lastEnsuredShippingRateForPaymentKeyRef,
            markShippingRatesCurrent,
            market,
            pendingPaymentShippingRateRef,
            selectShippingRate,
          }),
        ),
      { initialProps: { cart: firstCart, market: firstMarket } },
    )

    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledOnce())
    rerender({ cart: secondCart, market: firstMarket })
    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledTimes(2))

    await act(async () => {
      resolveFirst(firstCart)
      await firstEnsure
    })

    expect(markShippingRatesCurrent).not.toHaveBeenCalled()

    await act(async () => {
      resolveSecond(secondCart)
      await secondEnsure
    })

    expect(markShippingRatesCurrent).toHaveBeenCalledOnce()
  })

  it('ignores an old ensure failure after the checkout market changes', async () => {
    let rejectFirst: (error: Error) => void = () => undefined
    const firstEnsure = new Promise<CheckoutOrder>((_, reject) => {
      rejectFirst = reject
    })
    const secondEnsure = Promise.resolve(secondCart)
    const selectShippingRate = vi
      .fn<(rate: CartShippingRate) => Promise<CheckoutOrder>>()
      .mockReturnValueOnce(firstEnsure)
      .mockReturnValueOnce(secondEnsure)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const lastEnsuredShippingRateForPaymentKeyRef = {
      current: null,
    } as MutableRefObject<string | null>
    const pendingPaymentShippingRateRef = {
      current: null,
    } as MutableRefObject<CartShippingRate | null>

    const { rerender } = renderHook(
      ({
        cart,
        market,
      }: {
        cart: CheckoutOrder
        market: Pick<MarketSelectionInput, 'country' | 'locale'>
      }) =>
        useCheckoutShippingRateEffects(
          createOptions({
            cart,
            lastEnsuredShippingRateForPaymentKeyRef,
            market,
            pendingPaymentShippingRateRef,
            selectShippingRate,
            setCheckoutError,
            setSingleCheckoutSectionError,
          }),
        ),
      { initialProps: { cart: firstCart, market: firstMarket } },
    )

    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledOnce())
    rerender({ cart: firstCart, market: secondMarket })
    await waitFor(() => expect(selectShippingRate).toHaveBeenCalledTimes(2))

    await act(async () => {
      rejectFirst(new Error('old shipping request failed'))
      await firstEnsure.catch(() => undefined)
    })

    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })
})
