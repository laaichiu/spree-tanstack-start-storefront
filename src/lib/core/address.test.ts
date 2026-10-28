import { describe, expect, it } from 'vitest'

import { getAddressLines } from './address'

describe('address display', () => {
  it('formats normalized address fields in display order', () => {
    expect(
      getAddressLines({
        address1: '100 Market Street',
        address2: 'Suite 8',
        city: 'San Francisco',
        company: 'Spree',
        countryName: 'United States',
        phone: '+1 415 555 0100',
        postalCode: '94105',
        stateText: 'CA',
      }),
    ).toEqual([
      'Spree',
      '100 Market Street',
      'Suite 8',
      'San Francisco, CA 94105',
      'United States',
      '+1 415 555 0100',
    ])
  })

  it('omits unavailable optional lines without leaving separators', () => {
    expect(
      getAddressLines({
        address1: '1 Queen Street',
        address2: null,
        city: 'Auckland',
        company: null,
        countryName: 'New Zealand',
        phone: null,
        postalCode: null,
        stateText: null,
      }),
    ).toEqual(['1 Queen Street', 'Auckland', 'New Zealand'])
  })
})
