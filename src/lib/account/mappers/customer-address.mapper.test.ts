import { createClient } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { assertCustomerAddressResourceIsAddress } from '../utils/address-identity'
import { mapSpreeAddressToCustomerAddress } from './customer-address.mapper'

describe('customer address reference names', () => {
  it('formats country names from canonical ISO codes in the reader language', async () => {
    const address = {
      id: 'addr_name',
      address1: '1 Market Street',
      address2: null,
      city: 'San Francisco',
      company: null,
      country_code: 'US',
      first_name: 'Ada',
      full_name: 'Ada Lovelace',
      is_default_billing: false,
      is_default_shipping: false,
      last_name: 'Lovelace',
      phone: null,
      postal_code: '94105',
      quick_checkout: false,
      state_code: 'CA',
      state_name: null,
      state_text: 'California',
    }
    const client = createClient({
      baseUrl: 'https://api.example.com',
      publishableKey: 'pk_test',
      retry: false,
      fetch: async () =>
        new Response(JSON.stringify(address), {
          headers: { 'Content-Type': 'application/json' },
        }),
    })
    const resource = await client.customer.addresses.get(address.id)
    assertCustomerAddressResourceIsAddress(resource)
    expect(mapSpreeAddressToCustomerAddress(resource, 'fr').countryName).toBe(
      'États-Unis',
    )
    expect(mapSpreeAddressToCustomerAddress(resource, 'ja').countryName).toBe(
      'アメリカ合衆国',
    )
  })
})
