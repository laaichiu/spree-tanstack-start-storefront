import { describe, expect, it } from 'vitest'

import { getCheckoutShippingMethodPlaceholderKey } from './shipping-method-placeholder'

describe('getCheckoutShippingMethodPlaceholderKey', () => {
  it('prioritizes delivery address saving state', () => {
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        areShippingRatesStale: true,
        isAddressComplete: true,
        isAddressPending: true,
        isShippingPending: true,
      }),
    ).toBe('checkout.savingDelivery')
  })

  it('shows shipping method saving while a selected rate is being persisted', () => {
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        areShippingRatesStale: true,
        isAddressComplete: true,
        isAddressPending: false,
        isShippingPending: true,
      }),
    ).toBe('checkout.savingShippingMethod')
  })

  it('shows calculating copy only when stale rates have a complete address', () => {
    expect(
      getCheckoutShippingMethodPlaceholderKey({
        areShippingRatesStale: true,
        isAddressComplete: true,
        isAddressPending: false,
        isShippingPending: false,
      }),
    ).toBe('checkout.calculatingShippingMethods')

    expect(
      getCheckoutShippingMethodPlaceholderKey({
        areShippingRatesStale: true,
        isAddressComplete: false,
        isAddressPending: false,
        isShippingPending: false,
      }),
    ).toBe('checkout.shippingMethodPlaceholder')
  })
})
