import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { useCheckoutShippingAddressSave } from './use-checkout-shipping-address-save'

const saveCheckoutAddressMutation = vi.hoisted(() => vi.fn())
const mutationState = vi.hoisted(() => ({
  isPending: false,
}))
const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('./use-checkout-address', () => ({
  useUpdateCheckoutAddress: () => ({
    isPending: mutationState.isPending,
    mutateAsync: saveCheckoutAddressMutation,
  }),
}))

afterEach(() => {
  cleanup()
  navigateMock.mockReset()
  saveCheckoutAddressMutation.mockReset()
  mutationState.isPending = false
})

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {children}
    </MarketProvider>
  )
}

const cart = {
  id: 'cart_123',
} as CheckoutOrder

const address: CheckoutAddressInput = {
  address1: '123 Main Street',
  address2: '',
  city: 'New York',
  company: '',
  countryIso: 'US',
  email: 'customer@example.com',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '',
  postalCode: '10001',
  stateAbbr: 'NY',
  stateName: 'New York',
}

describe('useCheckoutShippingAddressSave', () => {
  it('navigates to the new checkout cart after saving an address', async () => {
    const updatedCart = { id: 'cart_456' } as CheckoutOrder
    const setCheckoutError = vi.fn()
    saveCheckoutAddressMutation.mockResolvedValueOnce(updatedCart)
    navigateMock.mockResolvedValueOnce(undefined)

    const { result } = renderHook(
      () => useCheckoutShippingAddressSave({ cart, setCheckoutError }),
      { wrapper },
    )

    let savedCart: CheckoutOrder | null = null
    await act(async () => {
      savedCart = await result.current.saveShippingAddress(address)
    })

    expect(savedCart).toBe(updatedCart)
    expect(saveCheckoutAddressMutation).toHaveBeenCalledWith(address)
    expect(navigateMock).toHaveBeenCalledWith({
      params: {
        country: 'us',
        id: 'cart_456',
        locale: 'en',
      },
      replace: true,
      search: {
        payment_error: undefined,
        payment_error_code: undefined,
      },
      to: '/$country/$locale/checkout/$id',
    })
    expect(setCheckoutError).not.toHaveBeenCalled()
  })

  it('surfaces address save errors without navigating', async () => {
    const setCheckoutError = vi.fn()
    saveCheckoutAddressMutation.mockRejectedValueOnce(
      new Error('Address service unavailable'),
    )

    const { result } = renderHook(
      () => useCheckoutShippingAddressSave({ cart, setCheckoutError }),
      { wrapper },
    )

    let savedCart: CheckoutOrder | null = null
    await act(async () => {
      savedCart = await result.current.saveShippingAddress(address)
    })

    expect(savedCart).toBeNull()
    expect(setCheckoutError).toHaveBeenCalledWith('Address service unavailable')
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
