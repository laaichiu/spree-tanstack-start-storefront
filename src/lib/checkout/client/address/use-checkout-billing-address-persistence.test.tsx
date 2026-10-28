import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  CheckoutBillingAddressInput,
  CheckoutOrder,
} from '@/lib/checkout/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import type { MarketSelectionInput } from '@/lib/core/market'

import { useCheckoutBillingAddressPersistence } from './use-checkout-billing-address-persistence'

const server = vi.hoisted(() => ({
  updateBillingAddress: vi.fn(),
}))

vi.mock('../use-checkout-address', () => ({
  useUpdateCheckoutBillingAddress: () => ({
    isPending: false,
    mutateAsync: server.updateBillingAddress,
  }),
}))

const cart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const nextCart = {
  ...cart,
  id: 'cart-2',
}
const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
} satisfies MarketSelectionInput
const nextMarket = {
  ...market,
  country: 'ca',
  locale: 'en-CA',
  marketId: 'market-ca',
} satisfies MarketSelectionInput
const billingAddress: CheckoutBillingAddressInput = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Francisco',
  company: '',
  countryIso: 'US',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '+1 555 0100',
  postalCode: '94105',
  stateAbbr: 'CA',
  stateName: 'California',
}

function createOptions(
  overrides: Partial<
    Parameters<typeof useCheckoutBillingAddressPersistence>[0]
  > = {},
) {
  return {
    billingForm: {
      trigger: vi.fn(),
    } as unknown as UseFormReturn<CheckoutBillingAddressInput>,
    billingMode: 'same' as const,
    cart,
    clearCheckoutSectionError: vi.fn(),
    handleSyncedBillingFields: vi.fn(),
    market,
    scrollToCheckoutSection: vi.fn(),
    setCheckoutError: vi.fn(),
    setSingleCheckoutSectionError: vi.fn(),
    syncBillingFormValuesFromDom: vi.fn(() => ({
      changedFields: [],
      values: billingAddress,
    })),
    t: (key: string) => key,
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout billing-address persistence', () => {
  it('keeps the billing mutation callback stable across unrelated rerenders', () => {
    const options = createOptions()
    const { result, rerender } = renderHook(() =>
      useCheckoutBillingAddressPersistence(options),
    )
    const initialPersistBillingAddress = result.current.persistBillingAddress

    rerender()

    expect(result.current.persistBillingAddress).toBe(
      initialPersistBillingAddress,
    )
  })

  it('ignores an old billing response after the checkout cart changes', async () => {
    let resolveBilling: (value: CheckoutOrder) => void = () => undefined
    const firstBilling = new Promise<CheckoutOrder>((resolve) => {
      resolveBilling = resolve
    })
    server.updateBillingAddress.mockReturnValueOnce(firstBilling)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const initialOptions = createOptions({
      setCheckoutError,
      setSingleCheckoutSectionError,
    })
    const { result, rerender } = renderHook(
      ({
        activeCart,
        activeMarket,
      }: {
        activeCart: CheckoutOrder
        activeMarket: MarketSelectionInput
      }) =>
        useCheckoutBillingAddressPersistence(
          createOptions({
            ...initialOptions,
            cart: activeCart,
            market: activeMarket,
          }),
        ),
      { initialProps: { activeCart: cart, activeMarket: market } },
    )

    let billingRequest: Promise<CheckoutOrder | null> | undefined
    act(() => {
      billingRequest = result.current.persistBillingAddress()
    })
    await waitFor(() =>
      expect(server.updateBillingAddress).toHaveBeenCalledOnce(),
    )

    rerender({ activeCart: nextCart, activeMarket: nextMarket })

    await act(async () => {
      resolveBilling(cart)
      await billingRequest
    })

    expect(await billingRequest).toBeNull()
    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('ignores a billing response after unmount', async () => {
    let resolveBilling: (value: CheckoutOrder) => void = () => undefined
    const billingRequest = new Promise<CheckoutOrder>((resolve) => {
      resolveBilling = resolve
    })
    server.updateBillingAddress.mockReturnValueOnce(billingRequest)
    const setCheckoutError = vi.fn()
    const setSingleCheckoutSectionError = vi.fn()
    const { result, unmount } = renderHook(() =>
      useCheckoutBillingAddressPersistence(
        createOptions({
          billingMode: 'different',
          setCheckoutError,
          setSingleCheckoutSectionError,
        }),
      ),
    )

    let request: Promise<CheckoutOrder | null> | undefined
    act(() => {
      request = result.current.persistBillingAddress()
    })
    await waitFor(() =>
      expect(server.updateBillingAddress).toHaveBeenCalledOnce(),
    )

    unmount()

    await act(async () => {
      resolveBilling(cart)
      await request
    })

    expect(await request).toBeNull()
    expect(setCheckoutError).not.toHaveBeenCalled()
    expect(setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })
})
