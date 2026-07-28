import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import {
  handleExpressCheckoutShippingAddressChange,
  handleExpressCheckoutShippingRateChange,
} from './express-checkout-shipping-flow'

function order(overrides: Partial<CheckoutOrder> = {}) {
  return {
    amountDue: { amount: 42, currencyCode: 'USD' },
    deliveryTotal: { amount: 8, currencyCode: 'USD' },
    shippingRates: [
      {
        deliveryMethodId: 'ground',
        displayPrice: { amount: 8, currencyCode: 'USD' },
        fulfillmentId: 'fulfillment-1',
        id: 'rate-1',
        name: 'Ground',
        price: { amount: 8, currencyCode: 'USD' },
        selected: true,
      },
    ],
    ...overrides,
  } as CheckoutOrder
}

function flowOptions() {
  const resolveShipping = vi.fn()
  const selectShippingRates = vi.fn()
  const buildLineItems = vi
    .fn()
    .mockReturnValue([{ amount: 4200, name: 'Total' }])
  const setError = vi.fn()
  const setShippingRateMap = vi.fn()
  const t = vi.fn((key: string) => key)
  const updateElementsAmount = vi.fn()

  return {
    actions: {
      resolveShipping,
      selectShippingRates,
    },
    buildLineItems,
    isGooglePay: false,
    setError,
    setShippingRateMap,
    t,
    updateElementsAmount,
  }
}

describe('express checkout shipping flow', () => {
  it('resolves a shipping address and exposes grouped rates to Stripe', async () => {
    const options = flowOptions()
    options.actions.resolveShipping.mockResolvedValue({
      order: order(),
      success: true,
    })
    const event = {
      address: {
        city: 'San Diego',
        country: 'US',
        postal_code: '92121',
        state: 'CA',
      },
      reject: vi.fn(),
      resolve: vi.fn(),
    } as unknown as StripeExpressCheckoutElementShippingAddressChangeEvent

    await handleExpressCheckoutShippingAddressChange({
      ...options,
      event,
    })

    expect(options.actions.resolveShipping).toHaveBeenCalledWith({
      city: 'San Diego',
      countryIso: 'US',
      postalCode: '92121',
      stateAbbr: 'CA',
      stateName: 'CA',
    })
    expect(options.setShippingRateMap).toHaveBeenCalledOnce()
    expect(options.updateElementsAmount).toHaveBeenCalledWith(4200)
    expect(event.resolve).toHaveBeenCalledWith({
      lineItems: [{ amount: 4200, name: 'Total' }],
      shippingRates: [
        {
          amount: 800,
          displayName: 'Ground',
          id: 'ground',
        },
      ],
    })
    expect(event.reject).not.toHaveBeenCalled()
  })

  it('rejects an unavailable shipping rate selection', async () => {
    const options = flowOptions()
    const event = {
      reject: vi.fn(),
      resolve: vi.fn(),
      shippingRate: {
        amount: 800,
        id: 'unknown-rate',
      },
    } as unknown as StripeExpressCheckoutElementShippingRateChangeEvent

    await handleExpressCheckoutShippingRateChange({
      actions: options.actions,
      buildLineItems: options.buildLineItems,
      event,
      setError: options.setError,
      shippingRateMap: new Map(),
      t: options.t,
      updateElementsAmount: options.updateElementsAmount,
    })

    expect(options.setError).toHaveBeenCalledWith(
      'checkout.shippingMethodSaveFailed',
    )
    expect(event.reject).toHaveBeenCalledOnce()
    expect(options.actions.selectShippingRates).not.toHaveBeenCalled()
  })

  it('selects the mapped rates and updates the payable line items', async () => {
    const options = flowOptions()
    options.actions.selectShippingRates.mockResolvedValue({
      order: order(),
      success: true,
    })
    const event = {
      reject: vi.fn(),
      resolve: vi.fn(),
      shippingRate: {
        amount: 1200,
        id: 'ground',
      },
    } as unknown as StripeExpressCheckoutElementShippingRateChangeEvent

    await handleExpressCheckoutShippingRateChange({
      actions: options.actions,
      buildLineItems: options.buildLineItems,
      event,
      setError: options.setError,
      shippingRateMap: new Map([
        [
          'ground',
          [
            {
              fulfillmentId: 'fulfillment-1',
              rateId: 'rate-1',
            },
          ],
        ],
      ]),
      t: options.t,
      updateElementsAmount: options.updateElementsAmount,
    })

    expect(options.actions.selectShippingRates).toHaveBeenCalledWith([
      {
        fulfillmentId: 'fulfillment-1',
        rateId: 'rate-1',
      },
    ])
    expect(options.updateElementsAmount).toHaveBeenCalledWith(4200)
    expect(options.setError).toHaveBeenCalledWith(null)
    expect(event.resolve).toHaveBeenCalledWith({
      lineItems: [{ amount: 4200, name: 'Total' }],
    })
    expect(event.reject).not.toHaveBeenCalled()
  })
})
