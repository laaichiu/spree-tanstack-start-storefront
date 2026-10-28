import { createClient } from '@spree/sdk'
import { describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { mapCheckoutAddressToParams } from '../address/checkout-address.mapper'
import { buildExpressCheckoutPlaceholderAddress } from './checkout-express-address'
import { expressCheckoutAddressParamsSchema } from './checkout-express.schemas'

const walletAddress = {
  address1: '1 Market St',
  city: 'San Francisco',
  country_code: ' us ',
  first_name: 'Ada',
  last_name: 'Lovelace',
  postal_code: '94105',
  state_code: ' ca ',
}

describe('cart address request contract', () => {
  it('sends canonical wallet fields and relaxed validation through the SDK', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: baseCart }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      publishableKey: 'pk_test',
      retry: false,
    })
    const shippingAddress =
      expressCheckoutAddressParamsSchema.parse(walletAddress)

    await client.carts.update('cart_address', {
      shipping_address: shippingAddress,
    })

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = fetch.mock.calls[0]
    expect(String(url)).toBe(
      'https://api.example.com/api/v3/store/carts/cart_address',
    )
    expect(JSON.parse(String(options?.body))).toEqual({
      shipping_address: {
        ...walletAddress,
        country_code: 'US',
        quick_checkout: true,
        state_code: 'CA',
      },
    })
  })

  it('uses the same canonical state code for normal and partial addresses', () => {
    expect(
      mapCheckoutAddressToParams({
        address1: '1 Market St',
        address2: '',
        city: 'San Francisco',
        company: '',
        countryIso: 'us',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: '',
        postalCode: '94105',
        stateAbbr: ' ca ',
        stateName: '',
      }),
    ).toMatchObject({ country_code: 'US', state_code: 'CA' })
    expect(
      buildExpressCheckoutPlaceholderAddress({
        city: 'San Francisco',
        countryIso: 'us',
        postalCode: '94105',
        stateAbbr: ' ca ',
      }),
    ).toMatchObject({
      country_code: 'US',
      quick_checkout: true,
      state_code: 'CA',
    })
  })

  it.each([
    { country_code: 'ZZ' },
    { country_code: 'USA' },
    { state_code: 42 },
    { quick_checkout: false },
    { state_abbr: 'CA' },
    { country_iso: 'US' },
  ])('rejects malformed or obsolete wallet fields: %o', (override) => {
    expect(() =>
      expressCheckoutAddressParamsSchema.parse({
        ...walletAddress,
        ...override,
      }),
    ).toThrow()
  })
})
