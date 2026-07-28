import { describe, expect, it } from 'vitest'

import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'

import {
  buildCheckoutAddressUpdateParams,
  getCheckoutAddressSaveSkipReason,
  mapCheckoutAddressToParams,
  preservePendingCheckoutEmail,
} from './address-update'

const address = {
  address1: '3909 Hood Avenue',
  address2: '',
  city: 'San Diego',
  company: '',
  countryIso: 'us',
  email: 'buyer@example.com',
  firstName: 'Theresa',
  lastName: 'Chavez',
  phone: '18587790443',
  postalCode: '92121',
  stateAbbr: 'ca',
  stateName: '',
} satisfies CheckoutAddressInput

describe('checkout address update helpers', () => {
  it('skips a non-forced address save when the address was already saved', () => {
    expect(
      getCheckoutAddressSaveSkipReason({
        lastSavedSignature: 'address-signature',
        signature: 'address-signature',
      }),
    ).toBe('already_saved')
  })

  it('skips a non-forced address save when the address is pending or already attempted', () => {
    expect(
      getCheckoutAddressSaveSkipReason({
        pendingSignature: 'address-signature',
        signature: 'address-signature',
      }),
    ).toBe('already_pending')

    expect(
      getCheckoutAddressSaveSkipReason({
        lastAttemptSignature: 'address-signature',
        signature: 'address-signature',
      }),
    ).toBe('already_pending')
  })

  it('allows forced address saves even when a signature was already seen', () => {
    expect(
      getCheckoutAddressSaveSkipReason({
        force: true,
        lastAttemptSignature: 'address-signature',
        lastSavedSignature: 'address-signature',
        pendingSignature: 'address-signature',
        signature: 'address-signature',
      }),
    ).toBe(null)
  })

  it('allows new address signatures to be saved', () => {
    expect(
      getCheckoutAddressSaveSkipReason({
        lastAttemptSignature: 'old-signature',
        lastSavedSignature: 'saved-signature',
        pendingSignature: 'pending-signature',
        signature: 'next-signature',
      }),
    ).toBe(null)
  })

  it('maps checkout address form values to Spree address params', () => {
    expect(mapCheckoutAddressToParams(address)).toEqual({
      address1: '3909 Hood Avenue',
      address2: undefined,
      city: 'San Diego',
      company: undefined,
      country_iso: 'US',
      first_name: 'Theresa',
      last_name: 'Chavez',
      phone: '18587790443',
      postal_code: '92121',
      state_abbr: 'CA',
      state_name: undefined,
    })
  })

  it('builds a full shipping address update for typed checkout addresses', () => {
    expect(
      buildCheckoutAddressUpdateParams({
        address,
        email: 'ignored@example.com',
      }),
    ).toEqual({
      email: 'buyer@example.com',
      shipping_address: {
        address1: '3909 Hood Avenue',
        address2: undefined,
        city: 'San Diego',
        company: undefined,
        country_iso: 'US',
        first_name: 'Theresa',
        last_name: 'Chavez',
        phone: '18587790443',
        postal_code: '92121',
        state_abbr: 'CA',
        state_name: undefined,
      },
      use_shipping: true,
    })
  })

  it('builds a saved-address update without requiring raw address fields', () => {
    expect(
      buildCheckoutAddressUpdateParams({
        email: 'account@example.com',
        shippingAddressId: 'addr_123',
      }),
    ).toEqual({
      email: 'account@example.com',
      shipping_address_id: 'addr_123',
      use_shipping: true,
    })
  })

  it('omits blank email when applying a saved address', () => {
    expect(
      buildCheckoutAddressUpdateParams({
        email: '   ',
        shippingAddressId: 'addr_123',
      }),
    ).toEqual({
      shipping_address_id: 'addr_123',
      use_shipping: true,
    })
  })

  it('keeps the next checkout email when it is already present', () => {
    expect(
      preservePendingCheckoutEmail({
        currentValues: {
          ...address,
          email: 'typed@example.com',
        },
        nextValues: {
          ...address,
          email: 'cart@example.com',
        },
      }).email,
    ).toBe('cart@example.com')
  })

  it('preserves a pending typed email when the next checkout address is blank', () => {
    expect(
      preservePendingCheckoutEmail({
        currentValues: {
          ...address,
          email: 'typed@example.com',
        },
        nextValues: {
          ...address,
          email: '',
        },
      }).email,
    ).toBe('typed@example.com')
  })
})
