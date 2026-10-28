import type {
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import { mapSpreeCheckoutToOrder } from '../../mappers/checkout.mapper'
import type { ExpressCheckoutShippingActions } from './express-checkout-actions'
import {
  handleExpressCheckoutShippingAddressChange,
  handleExpressCheckoutShippingRateChange,
} from './express-checkout-shipping-flow'
import type { ExpressCheckoutRateSelection } from './express-checkout-shipping'

const checkoutOrder = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })

function createAddressChangeEvent() {
  return {
    address: {
      city: 'San Francisco',
      country: 'US',
      postal_code: '94105',
      state: 'CA',
    },
    reject: vi.fn(),
    resolve: vi.fn(),
  } as unknown as StripeExpressCheckoutElementShippingAddressChangeEvent
}

function createRateChangeEvent() {
  return {
    reject: vi.fn(),
    resolve: vi.fn(),
    shippingRate: {
      amount: 500,
      id: 'stripe-rate-1',
    },
  } as unknown as StripeExpressCheckoutElementShippingRateChangeEvent
}

function createShippingActions(): ExpressCheckoutShippingActions {
  return {
    resolveShipping: vi.fn(),
    selectShippingRates: vi.fn(),
  }
}

function createAddressFlowOptions(
  actions: ExpressCheckoutShippingActions,
  event: StripeExpressCheckoutElementShippingAddressChangeEvent,
  isCurrent: () => boolean,
) {
  return {
    actions,
    buildLineItems: vi.fn(() => []),
    event,
    isCurrent,
    isGooglePay: false,
    setError: vi.fn(),
    setShippingRateMap: vi.fn(),
    t: vi.fn((key) => key),
    updateElementsAmount: vi.fn(),
  }
}

describe('Express Checkout shipping flow', () => {
  it('rejects an address response that belongs to an older event', async () => {
    const actions = createShippingActions()
    let resolveShipping: (result: {
      order: typeof checkoutOrder
      success: true
    }) => void = () => undefined
    const shippingRequest = new Promise<{
      order: typeof checkoutOrder
      success: true
    }>((resolve) => {
      resolveShipping = resolve
    })
    vi.mocked(actions.resolveShipping).mockReturnValue(shippingRequest)
    let current = true
    const event = createAddressChangeEvent()
    const options = createAddressFlowOptions(actions, event, () => current)

    const flow = handleExpressCheckoutShippingAddressChange(options)
    current = false
    resolveShipping({ order: checkoutOrder, success: true })
    await flow

    expect(event.reject).toHaveBeenCalledOnce()
    expect(event.resolve).not.toHaveBeenCalled()
    expect(options.setError).not.toHaveBeenCalled()
    expect(options.setShippingRateMap).not.toHaveBeenCalled()
    expect(options.updateElementsAmount).not.toHaveBeenCalled()
  })

  it('rejects a rate response that belongs to an older event', async () => {
    const actions = createShippingActions()
    let resolveShipping: (result: {
      order: typeof checkoutOrder
      success: true
    }) => void = () => undefined
    const shippingRequest = new Promise<{
      order: typeof checkoutOrder
      success: true
    }>((resolve) => {
      resolveShipping = resolve
    })
    vi.mocked(actions.selectShippingRates).mockReturnValue(shippingRequest)
    let current = true
    const event = createRateChangeEvent()
    const selectionMap = new Map<string, ExpressCheckoutRateSelection[]>([
      ['stripe-rate-1', [{ fulfillmentId: 'fulfillment-1', rateId: 'rate-1' }]],
    ])
    const options = {
      actions,
      buildLineItems: vi.fn(() => []),
      event,
      isCurrent: () => current,
      setError: vi.fn(),
      shippingRateMap: selectionMap,
      t: vi.fn((key) => key),
      updateElementsAmount: vi.fn(),
    }

    const flow = handleExpressCheckoutShippingRateChange(options)
    current = false
    resolveShipping({ order: checkoutOrder, success: true })
    await flow

    expect(event.reject).toHaveBeenCalledOnce()
    expect(event.resolve).not.toHaveBeenCalled()
    expect(options.setError).not.toHaveBeenCalled()
    expect(options.updateElementsAmount).not.toHaveBeenCalled()
  })
})
