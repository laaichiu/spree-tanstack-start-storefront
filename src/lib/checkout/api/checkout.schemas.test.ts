import { describe, expect, it } from 'vitest'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import {
  updateCheckoutAddressInputSchema,
  updateCheckoutBillingAddressInputSchema,
} from './address/checkout-address.schemas'
import {
  expressCheckoutAddressParamsSchema,
  expressCheckoutPartialAddressInputSchema,
} from './express/checkout-express.schemas'
import { buildExpressCheckoutPlaceholderAddress } from './express/checkout-express-address'

const market = {
  country: 'us',
  locale: 'en',
}

const address = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Diego',
  company: '',
  countryIso: 'US',
  email: 'guest@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '555-0100',
  postalCode: '92101',
  stateAbbr: 'CA',
  stateName: '',
} satisfies CheckoutAddressInput

const billingAddress = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Diego',
  company: '',
  countryIso: 'US',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '',
  postalCode: '92101',
  stateAbbr: 'CA',
  stateName: '',
} satisfies CheckoutBillingAddressInput

describe('checkout server input schemas', () => {
  it('requires either a delivery address or a saved delivery address id', () => {
    expect(
      updateCheckoutAddressInputSchema.safeParse({
        cartId: 'cart_123',
        market,
      }).success,
    ).toBe(false)

    expect(
      updateCheckoutAddressInputSchema.parse({
        address,
        cartId: 'cart_123',
        email: '',
        market,
      }),
    ).toMatchObject({
      address,
      cartId: 'cart_123',
      email: undefined,
    })

    expect(
      updateCheckoutAddressInputSchema.parse({
        cartId: 'cart_123',
        market,
        shippingAddressId: 'addr_123',
      }),
    ).toMatchObject({
      shippingAddressId: 'addr_123',
    })
  })

  it('requires a billing address unless billing uses shipping', () => {
    expect(
      updateCheckoutBillingAddressInputSchema.safeParse({
        cartId: 'cart_123',
        market,
        useShipping: false,
      }).success,
    ).toBe(false)

    expect(
      updateCheckoutBillingAddressInputSchema.parse({
        billingAddress,
        cartId: 'cart_123',
        market,
        useShipping: false,
      }),
    ).toMatchObject({
      cartId: 'cart_123',
      useShipping: false,
    })

    expect(
      updateCheckoutBillingAddressInputSchema.parse({
        cartId: 'cart_123',
        market,
        useShipping: true,
      }),
    ).toMatchObject({
      useShipping: true,
    })
  })

  it('normalizes express checkout address params for Spree', () => {
    expect(
      expressCheckoutAddressParamsSchema.parse({
        address1: '3909 Hood Avenue',
        city: 'San Diego',
        country_iso: 'us',
        first_name: 'Ada',
        last_name: 'Lovelace',
        phone: '',
        postal_code: '92101',
        state_abbr: 'ca',
        state_name: ' ',
      }),
    ).toEqual({
      address1: '3909 Hood Avenue',
      city: 'San Diego',
      country_iso: 'US',
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone: '',
      postal_code: '92101',
      quick_checkout: true,
      state_abbr: 'CA',
      state_name: undefined,
    })
  })

  it('builds express checkout placeholder shipping addresses', () => {
    const parsed = expressCheckoutPartialAddressInputSchema.parse({
      address: {
        city: 'San Diego',
        countryIso: 'us',
        postalCode: '92101',
        stateAbbr: 'ca',
      },
      cartId: 'cart_123',
      market,
    })

    expect(buildExpressCheckoutPlaceholderAddress(parsed.address)).toEqual({
      address1: 'TBD',
      city: 'San Diego',
      country_iso: 'US',
      first_name: 'Express',
      last_name: 'Checkout',
      postal_code: '92101',
      quick_checkout: true,
      state_abbr: 'CA',
      state_name: undefined,
    })
  })
})
