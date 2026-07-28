import { describe, expect, it } from 'vitest'

import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutAddress } from '@/lib/checkout/model/checkout'

import { getSelectedCheckoutSavedAddressId } from './saved-address-selection'

function customerAddress(id: string): CustomerAddress {
  return {
    address1: '123 Main Street',
    address2: null,
    city: 'New York',
    company: null,
    countryIso: 'US',
    countryName: 'United States',
    firstName: 'Ada',
    fullName: 'Ada Lovelace',
    id,
    isDefaultBilling: false,
    isDefaultShipping: false,
    lastName: 'Lovelace',
    phone: null,
    postalCode: '10001',
    quickCheckout: false,
    stateAbbr: 'NY',
    stateName: null,
    stateText: 'NY',
  }
}

function checkoutAddress(id: string): CheckoutAddress {
  return {
    address1: '123 Main Street',
    address2: null,
    city: 'New York',
    company: null,
    countryIso: 'US',
    countryName: 'United States',
    firstName: 'Ada',
    fullName: 'Ada Lovelace',
    id,
    lastName: 'Lovelace',
    phone: null,
    postalCode: '10001',
    stateAbbr: 'NY',
    stateName: null,
    stateText: 'NY',
  }
}

describe('getSelectedCheckoutSavedAddressId', () => {
  it('selects the saved address that matches the checkout shipping address', () => {
    expect(
      getSelectedCheckoutSavedAddressId({
        savedAddresses: [customerAddress('addr_1'), customerAddress('addr_2')],
        shippingAddress: checkoutAddress('addr_2'),
      }),
    ).toBe('addr_2')
  })

  it('returns null when the checkout shipping address is not saved', () => {
    expect(
      getSelectedCheckoutSavedAddressId({
        savedAddresses: [customerAddress('addr_1')],
        shippingAddress: checkoutAddress('addr_other'),
      }),
    ).toBe(null)
  })

  it('returns null when checkout has no shipping address yet', () => {
    expect(
      getSelectedCheckoutSavedAddressId({
        savedAddresses: [customerAddress('addr_1')],
        shippingAddress: null,
      }),
    ).toBe(null)
  })
})
