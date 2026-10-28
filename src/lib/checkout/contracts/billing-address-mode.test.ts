import { describe, expect, it } from 'vitest'

import { getCheckoutBillingAddressMode } from './billing-address-mode'

const billingAddress = {
  address1: '1 Main Street',
  address2: null,
  city: 'Portland',
  company: null,
  countryIso: 'US',
  countryName: 'United States',
  firstName: 'Ada',
  fullName: 'Ada Lovelace',
  id: 'addr_1',
  lastName: 'Lovelace',
  phone: null,
  postalCode: '97205',
  stateAbbr: 'OR',
  stateName: 'Oregon',
  stateText: 'Oregon',
}

describe('getCheckoutBillingAddressMode', () => {
  it('uses the checkout match flag for a present billing address', () => {
    expect(
      getCheckoutBillingAddressMode({
        billingAddress,
        shippingMatchesBillingAddress: true,
      }),
    ).toBe('same')

    expect(
      getCheckoutBillingAddressMode({
        billingAddress,
        shippingMatchesBillingAddress: false,
      }),
    ).toBe('different')
  })

  it('keeps a missing billing address in same-as-shipping mode', () => {
    expect(
      getCheckoutBillingAddressMode({
        billingAddress: null,
        shippingMatchesBillingAddress: false,
      }),
    ).toBe('same')
  })
})
