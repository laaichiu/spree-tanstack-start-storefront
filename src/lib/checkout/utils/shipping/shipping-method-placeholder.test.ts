import { describe, expect, it } from 'vitest'

import { getCheckoutShippingMethodPlaceholderKey } from './shipping-method-placeholder'

const complete = {
  areShippingRatesStale: false,
  isAddressComplete: true,
  isAddressPending: false,
  isShippingPending: false,
}

describe('Checkout shipping placeholder', () => {
  it('distinguishes no delivery quote from an incomplete address', () => {
    expect(getCheckoutShippingMethodPlaceholderKey(complete)).toBe(
      'checkout.shippingMethodsUnavailable',
    )
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        ...complete,
        isAddressComplete: false,
      }),
    ).toBe('checkout.shippingMethodPlaceholder')
  })

  it('keeps pending delivery states ahead of the unavailable message', () => {
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        ...complete,
        isAddressPending: true,
      }),
    ).toBe('checkout.savingDelivery')
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        ...complete,
        isShippingPending: true,
      }),
    ).toBe('checkout.savingShippingMethod')
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        ...complete,
        areShippingRatesStale: true,
      }),
    ).toBe('checkout.calculatingShippingMethods')
  })
})
