import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  CheckoutAddressInput,
  CheckoutOrder,
} from '@/lib/checkout/contracts'
import type { CustomerAddress } from '@/lib/account/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { useCheckoutAddressPersistence } from './use-checkout-address-persistence'

const server = vi.hoisted(() => ({
  saveShippingAddress: vi.fn(),
}))

vi.mock('./use-checkout-shipping-address-save', () => ({
  useCheckoutShippingAddressSave: () => ({
    isAddressPending: false,
    saveShippingAddress: server.saveShippingAddress,
  }),
}))

vi.mock('./use-checkout-billing-address-persistence', () => ({
  useCheckoutBillingAddressPersistence: () => ({
    isBillingPending: false,
    persistBillingAddress: vi.fn(),
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
const address: CheckoutAddressInput = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Francisco',
  company: '',
  countryIso: 'US',
  email: 'customer@example.com',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '+1 555 0100',
  postalCode: '94105',
  stateAbbr: 'CA',
  stateName: 'California',
}
const savedAddress: CustomerAddress = {
  address1: '3909 Hood Avenue',
  address2: null,
  city: 'San Francisco',
  company: null,
  countryIso: 'US',
  countryName: 'United States',
  firstName: 'Theresa',
  fullName: 'Theresa Chavez',
  id: 'address-1',
  isDefaultBilling: false,
  isDefaultShipping: false,
  lastName: 'Chavez',
  phone: '+1 555 0100',
  postalCode: '94105',
  quickCheckout: false,
  stateAbbr: 'CA',
  stateName: 'California',
  stateText: null,
}

function createOptions(
  overrides: Partial<Parameters<typeof useCheckoutAddressPersistence>[0]> = {},
) {
  return {
    billingForm: {
      reset: vi.fn(),
    } as never,
    billingMode: 'same' as const,
    cart,
    clearCheckoutSectionError: vi.fn(),
    form: {
      getValues: vi.fn((field?: string) =>
        field === 'email' ? address.email : address,
      ),
      reset: vi.fn(),
    } as never,
    handleSyncedBillingFields: vi.fn(),
    handleSyncedDeliveryFields: vi.fn(),
    initialBillingAddressValues: address,
    initialShippingAddressValues: address,
    isCheckoutSubmitting: false,
    market,
    markShippingRatesCurrent: vi.fn(),
    markShippingRatesStale: vi.fn(),
    navigateToCheckout: vi.fn().mockResolvedValue(undefined),
    scrollToCheckoutSection: vi.fn(),
    setCheckoutError: vi.fn(),
    setSelectedSavedAddressId: vi.fn(),
    setSingleCheckoutSectionError: vi.fn(),
    savedAddresses: [],
    syncBillingFormValuesFromDom: vi.fn(),
    syncDeliveryFormValuesFromDom: vi.fn(() => ({
      changedFields: [],
      values: address,
    })),
    t: (key: string) => key,
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout address persistence', () => {
  it('does not autosave while checkout submit is in flight', async () => {
    const options = createOptions({ isCheckoutSubmitting: true })
    const { result } = renderHook(() => useCheckoutAddressPersistence(options))

    await act(async () => {
      await result.current.attemptAutoSaveAddress()
    })

    expect(server.saveShippingAddress).not.toHaveBeenCalled()
  })

  it('keeps autosave available outside checkout submit', async () => {
    const updatedCart = { ...cart } as CheckoutOrder
    server.saveShippingAddress.mockResolvedValueOnce(updatedCart)
    const { result } = renderHook(() =>
      useCheckoutAddressPersistence(
        createOptions({
          initialShippingAddressValues: {
            ...address,
            address1: 'Old address',
          },
        }),
      ),
    )

    await act(async () => {
      await result.current.attemptAutoSaveAddress()
    })

    expect(server.saveShippingAddress).toHaveBeenCalledOnce()
  })

  it('does not clear the new cart saved-address selection after an old save settles', async () => {
    let resolveSave: (value: CheckoutOrder | null) => void = () => undefined
    const firstSave = new Promise<CheckoutOrder | null>((resolve) => {
      resolveSave = resolve
    })
    server.saveShippingAddress.mockReturnValueOnce(firstSave)
    const setSelectedSavedAddressId = vi.fn()
    const initialOptions = createOptions({
      setSelectedSavedAddressId,
    })
    const { result, rerender } = renderHook(
      ({ activeCart }: { activeCart: CheckoutOrder }) =>
        useCheckoutAddressPersistence(
          createOptions({
            ...initialOptions,
            cart: activeCart,
          }),
        ),
      { initialProps: { activeCart: cart } },
    )

    let saveRequest: Promise<CheckoutOrder | null> | undefined
    act(() => {
      saveRequest = result.current.persistCheckoutSavedAddress(savedAddress)
    })
    expect(setSelectedSavedAddressId).toHaveBeenCalledWith(savedAddress.id)

    rerender({ activeCart: nextCart })

    await act(async () => {
      resolveSave(null)
      await saveRequest
    })

    expect(setSelectedSavedAddressId).toHaveBeenCalledTimes(1)
    expect(setSelectedSavedAddressId).not.toHaveBeenCalledWith(null)
  })
})
