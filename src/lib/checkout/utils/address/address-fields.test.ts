import { describe, expect, it } from 'vitest'

import {
  CHECKOUT_ADDRESS_FIELD_NAMES,
  CHECKOUT_BILLING_ADDRESS_FIELD_NAMES,
  CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAMES,
  isCheckoutShippingRateAddressFieldName,
} from './address-fields'

describe('checkout address field helpers', () => {
  it('tracks email only as a checkout contact field', () => {
    expect(CHECKOUT_ADDRESS_FIELD_NAMES).toContain('email')
    expect(CHECKOUT_BILLING_ADDRESS_FIELD_NAMES).not.toContain('email')
    expect(CHECKOUT_SHIPPING_RATE_ADDRESS_FIELD_NAMES).not.toContain('email')
  })

  it('marks address fields that can affect shipping rates', () => {
    expect(isCheckoutShippingRateAddressFieldName('countryIso')).toBe(true)
    expect(isCheckoutShippingRateAddressFieldName('stateAbbr')).toBe(true)
    expect(isCheckoutShippingRateAddressFieldName('postalCode')).toBe(true)
    expect(isCheckoutShippingRateAddressFieldName('email')).toBe(false)
  })

  it('rejects missing or unrelated field names', () => {
    expect(isCheckoutShippingRateAddressFieldName(null)).toBe(false)
    expect(isCheckoutShippingRateAddressFieldName(undefined)).toBe(false)
    expect(isCheckoutShippingRateAddressFieldName('paymentMethodId')).toBe(
      false,
    )
  })
})
