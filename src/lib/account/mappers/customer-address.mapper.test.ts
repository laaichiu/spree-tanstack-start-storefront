import type { Address } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { mapSpreeAddressesToCustomerAddresses } from '@/lib/account/mappers/customer-address.mapper'
import { getAddressLines } from '@/lib/account/model/customer-address'

function buildAddress(overrides: Partial<Address> = {}): Address {
  const address: Address = {
    address1: '100 Market St',
    address2: 'Suite 3',
    city: 'San Francisco',
    company: 'Spree',
    country_iso: 'US',
    country_name: 'United States',
    first_name: 'Theresa',
    full_name: 'Theresa Chavez',
    id: 'addr_1',
    is_default_billing: true,
    is_default_shipping: false,
    last_name: 'Chavez',
    phone: '555-1000',
    postal_code: '94105',
    quick_checkout: false,
    state_abbr: 'CA',
    state_name: 'California',
    state_text: 'CA',
  }

  return Object.assign(address, overrides)
}

describe('mapSpreeAddressesToCustomerAddresses', () => {
  it('maps Spree addresses to frontend customer address models', () => {
    expect(mapSpreeAddressesToCustomerAddresses([buildAddress()])).toEqual([
      {
        address1: '100 Market St',
        address2: 'Suite 3',
        city: 'San Francisco',
        company: 'Spree',
        countryIso: 'US',
        countryName: 'United States',
        firstName: 'Theresa',
        fullName: 'Theresa Chavez',
        id: 'addr_1',
        isDefaultBilling: true,
        isDefaultShipping: false,
        lastName: 'Chavez',
        phone: '555-1000',
        postalCode: '94105',
        quickCheckout: false,
        stateAbbr: 'CA',
        stateName: 'California',
        stateText: 'CA',
      },
    ])
  })

  it('normalizes blank optional address fields to null', () => {
    const [address] = mapSpreeAddressesToCustomerAddresses([
      buildAddress({
        address2: '   ',
        company: '',
        phone: null,
        state_text: '',
      }),
    ])

    expect(address.address2).toBeNull()
    expect(address.company).toBeNull()
    expect(address.phone).toBeNull()
    expect(address.stateText).toBeNull()
  })

  it('formats normalized addresses into reusable display lines', () => {
    const [address] = mapSpreeAddressesToCustomerAddresses([buildAddress()])

    expect(getAddressLines(address)).toEqual([
      'Spree',
      '100 Market St',
      'Suite 3',
      'San Francisco, CA 94105',
      'United States',
      '555-1000',
    ])
  })
})
