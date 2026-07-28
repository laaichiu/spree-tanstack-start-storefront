import { describe, expect, it } from 'vitest'

import type { CustomerAddress } from '@/lib/account/model/customer-address'

import {
  getCheckoutAddressFormDefaultsFromCustomerAddress,
  readCheckoutAddressFormValues,
  readCheckoutBillingAddressFormValues,
} from './checkout-form'

const savedAddress = {
  address1: '3909 Hood Avenue',
  address2: null,
  city: 'San Diego',
  company: 'Evergreen Studio',
  countryIso: 'US',
  countryName: 'United States',
  firstName: 'Theresa',
  fullName: 'Theresa Chavez',
  id: 'addr_123',
  isDefaultBilling: false,
  isDefaultShipping: true,
  lastName: 'Chavez',
  phone: '18587790443',
  postalCode: '92121',
  quickCheckout: false,
  stateAbbr: 'CA',
  stateName: 'California',
  stateText: 'CA',
} satisfies CustomerAddress

describe('checkout form helpers', () => {
  it('maps a normalized customer address into checkout delivery form defaults', () => {
    expect(
      getCheckoutAddressFormDefaultsFromCustomerAddress({
        address: savedAddress,
        email: 'buyer@example.com',
      }),
    ).toEqual({
      address1: '3909 Hood Avenue',
      address2: '',
      city: 'San Diego',
      company: 'Evergreen Studio',
      countryIso: 'US',
      email: 'buyer@example.com',
      firstName: 'Theresa',
      lastName: 'Chavez',
      phone: '18587790443',
      postalCode: '92121',
      stateAbbr: 'CA',
      stateName: 'California',
    })
  })

  it('uses short state text as an abbreviation fallback for saved checkout addresses', () => {
    expect(
      getCheckoutAddressFormDefaultsFromCustomerAddress({
        address: {
          ...savedAddress,
          stateAbbr: null,
          stateName: null,
          stateText: 'CA',
        },
        email: 'buyer@example.com',
      }),
    ).toMatchObject({
      stateAbbr: 'CA',
      stateName: '',
    })
  })

  it('keeps long state text as a state name fallback', () => {
    expect(
      getCheckoutAddressFormDefaultsFromCustomerAddress({
        address: {
          ...savedAddress,
          stateAbbr: null,
          stateName: null,
          stateText: 'California',
        },
        email: 'buyer@example.com',
      }),
    ).toMatchObject({
      stateAbbr: '',
      stateName: 'California',
    })
  })

  it('preserves fallback checkout state values when conditional controls are missing', () => {
    const form = document.createElement('form')
    const address = document.createElement('input')
    address.name = 'address1'
    address.value = '600 Montgomery Street'
    form.append(address)

    expect(
      readCheckoutAddressFormValues(form, {
        address1: '3909 Hood Avenue',
        address2: '',
        city: 'San Diego',
        company: '',
        countryIso: 'US',
        email: 'buyer@example.com',
        firstName: 'Theresa',
        lastName: 'Chavez',
        phone: '18587790443',
        postalCode: '92121',
        stateAbbr: 'CA',
        stateName: '',
      }),
    ).toMatchObject({
      address1: '600 Montgomery Street',
      stateAbbr: 'CA',
      stateName: '',
    })
  })

  it('preserves fallback billing state values when conditional controls are missing', () => {
    const root = document.createElement('div')
    const address = document.createElement('input')
    address.name = 'address1'
    address.value = '600 Montgomery Street'
    root.append(address)

    expect(
      readCheckoutBillingAddressFormValues(root, {
        address1: '3909 Hood Avenue',
        address2: '',
        city: 'San Diego',
        company: '',
        countryIso: 'US',
        firstName: 'Theresa',
        lastName: 'Chavez',
        phone: '',
        postalCode: '92121',
        stateAbbr: 'CA',
        stateName: '',
      }),
    ).toMatchObject({
      address1: '600 Montgomery Street',
      stateAbbr: 'CA',
      stateName: '',
    })
  })
})
