import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { useCheckoutShippingAddressSave } from './use-checkout-shipping-address-save'

const server = vi.hoisted(() => ({
  saveCheckoutAddress: vi.fn(),
}))

vi.mock('../use-checkout-address', () => ({
  useUpdateCheckoutAddress: () => ({
    isPending: false,
    mutateAsync: server.saveCheckoutAddress,
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
}
const input = { email: 'ada@example.com', shippingAddressId: 'addr_ada' }

function createOptions(
  overrides: Partial<Parameters<typeof useCheckoutShippingAddressSave>[0]> = {},
) {
  return {
    cart,
    market,
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    setCheckoutError: vi.fn(),
    t: (key: string) => key,
    ...overrides,
  }
}

function createHarness() {
  const queryClient = new QueryClient()

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return Wrapper
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout shipping-address save', () => {
  it('ignores a duplicate address save while the first request is in flight', async () => {
    let resolveSave: (value: typeof cart) => void = () => undefined
    server.saveCheckoutAddress.mockReturnValueOnce(
      new Promise<typeof cart>((resolve) => {
        resolveSave = resolve
      }),
    )
    const { result } = renderHook(
      () => useCheckoutShippingAddressSave(createOptions()),
      { wrapper: createHarness() },
    )

    let firstSave: Promise<typeof cart | null> | undefined
    act(() => {
      firstSave = result.current.saveShippingAddress(input)
      void result.current.saveShippingAddress(input)
    })

    expect(server.saveCheckoutAddress).toHaveBeenCalledOnce()

    await act(async () => {
      resolveSave(cart)
      await firstSave
    })

    expect(server.saveCheckoutAddress).toHaveBeenCalledOnce()
  })

  it('releases the address-save guard after a failed request', async () => {
    server.saveCheckoutAddress
      .mockRejectedValueOnce(new Error('address save failed'))
      .mockResolvedValueOnce(cart)
    const { result } = renderHook(
      () => useCheckoutShippingAddressSave(createOptions()),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await result.current.saveShippingAddress(input)
    })
    await act(async () => {
      await result.current.saveShippingAddress(input)
    })

    expect(server.saveCheckoutAddress).toHaveBeenCalledTimes(2)
  })

  it('ignores an old address-save response after the checkout cart changes', async () => {
    let resolveSave: (value: typeof cart) => void = () => undefined
    const firstSaveResult = new Promise<typeof cart>((resolve) => {
      resolveSave = resolve
    })
    server.saveCheckoutAddress.mockReturnValueOnce(firstSaveResult)
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const setCheckoutError = vi.fn()
    const initialOptions = createOptions({
      navigateToCheckout,
      setCheckoutError,
    })
    const { result, rerender } = renderHook(
      ({ activeCart }: { activeCart: typeof cart }) =>
        useCheckoutShippingAddressSave(
          createOptions({
            ...initialOptions,
            cart: activeCart,
          }),
        ),
      { initialProps: { activeCart: cart }, wrapper: createHarness() },
    )

    let saveRequest: Promise<typeof cart | null> | undefined
    act(() => {
      saveRequest = result.current.saveShippingAddress(input)
    })
    rerender({ activeCart: nextCart })

    await act(async () => {
      resolveSave(cart)
      await saveRequest
    })

    expect(await saveRequest).toBeNull()
    expect(navigateToCheckout).not.toHaveBeenCalled()
    expect(setCheckoutError).not.toHaveBeenCalled()
  })

  it('ignores an address-save response after unmount', async () => {
    let resolveSave: (value: typeof nextCart) => void = () => undefined
    const saveRequest = new Promise<typeof nextCart>((resolve) => {
      resolveSave = resolve
    })
    server.saveCheckoutAddress.mockReturnValueOnce(saveRequest)
    const navigateToCheckout = vi.fn().mockResolvedValue(undefined)
    const setCheckoutError = vi.fn()
    const { result, unmount } = renderHook(
      () =>
        useCheckoutShippingAddressSave(
          createOptions({ navigateToCheckout, setCheckoutError }),
        ),
      { wrapper: createHarness() },
    )

    let request: Promise<typeof cart | null> | undefined
    act(() => {
      request = result.current.saveShippingAddress(input)
    })
    await waitFor(() =>
      expect(server.saveCheckoutAddress).toHaveBeenCalledOnce(),
    )

    unmount()

    await act(async () => {
      resolveSave(nextCart)
      await request
    })

    expect(navigateToCheckout).not.toHaveBeenCalled()
    expect(setCheckoutError).not.toHaveBeenCalled()
  })

  it('keeps an address save successful when cart navigation fails', async () => {
    server.saveCheckoutAddress.mockResolvedValueOnce(nextCart)
    const navigationError = new Error('checkout navigation failed')
    const navigateToCheckout = vi.fn().mockRejectedValue(navigationError)
    const setCheckoutError = vi.fn()
    const { result } = renderHook(
      () =>
        useCheckoutShippingAddressSave(
          createOptions({ navigateToCheckout, setCheckoutError }),
        ),
      { wrapper: createHarness() },
    )

    let savedCart: typeof nextCart | null = null
    await act(async () => {
      savedCart = await result.current.saveShippingAddress(input)
    })

    expect(savedCart).toEqual(nextCart)
    expect(server.saveCheckoutAddress).toHaveBeenCalledOnce()
    expect(navigateToCheckout).toHaveBeenCalledWith(nextCart.id)
    expect(setCheckoutError).toHaveBeenCalledWith('checkout navigation failed')
  })
})
