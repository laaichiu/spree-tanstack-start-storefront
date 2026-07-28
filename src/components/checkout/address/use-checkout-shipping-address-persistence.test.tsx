import { act, cleanup, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'

import { useCheckoutShippingAddressPersistence } from './use-checkout-shipping-address-persistence'

const saveShippingAddress = vi.hoisted(() => vi.fn())

vi.mock('./use-checkout-shipping-address-save', () => ({
  useCheckoutShippingAddressSave: () => ({
    isAddressPending: false,
    saveShippingAddress,
  }),
}))

afterEach(() => {
  cleanup()
  saveShippingAddress.mockReset()
})

const addressValues: CheckoutAddressInput = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Diego',
  company: '',
  countryIso: 'US',
  email: 'customer@example.com',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '18587790443',
  postalCode: '92121',
  stateAbbr: 'CA',
  stateName: '',
}

const savedAddress: CustomerAddress = {
  address1: addressValues.address1,
  address2: null,
  city: addressValues.city,
  company: null,
  countryIso: addressValues.countryIso,
  countryName: 'United States',
  firstName: addressValues.firstName,
  fullName: `${addressValues.firstName} ${addressValues.lastName}`,
  id: 'address_123',
  isDefaultBilling: false,
  isDefaultShipping: true,
  lastName: addressValues.lastName,
  phone: addressValues.phone,
  postalCode: addressValues.postalCode,
  quickCheckout: false,
  stateAbbr: addressValues.stateAbbr,
  stateName: null,
  stateText: addressValues.stateAbbr,
}

describe('useCheckoutShippingAddressPersistence', () => {
  it('reapplies a saved address after the customer switches to manual mode', async () => {
    const cart = {
      email: addressValues.email,
      id: 'cart_123',
    } as CheckoutOrder
    const setSelectedSavedAddressId = vi.fn()
    saveShippingAddress.mockResolvedValue(cart)

    const { result } = renderHook(() => {
      const form = useForm<CheckoutAddressInput>({
        defaultValues: addressValues,
      })
      const persistence = useCheckoutShippingAddressPersistence({
        cart,
        clearCheckoutSectionError: vi.fn(),
        form,
        handleSyncedDeliveryFields: vi.fn(),
        initialShippingAddressValues: addressValues,
        markShippingRatesCurrent: vi.fn(),
        markShippingRatesStale: vi.fn(),
        setCheckoutError: vi.fn(),
        setSelectedSavedAddressId,
        syncDeliveryFormValuesFromDom: () => ({
          changedFields: [],
          values: form.getValues(),
        }),
      })

      return persistence
    })

    await act(async () => {
      await result.current.persistCheckoutSavedAddress(savedAddress)
      setSelectedSavedAddressId(null)
      await result.current.persistCheckoutSavedAddress(savedAddress)
    })

    expect(saveShippingAddress).toHaveBeenCalledTimes(2)
    expect(saveShippingAddress).toHaveBeenLastCalledWith({
      email: addressValues.email,
      shippingAddressId: savedAddress.id,
    })
    expect(setSelectedSavedAddressId).toHaveBeenLastCalledWith(savedAddress.id)
  })
})
