import { describe, expect, it } from 'vitest'

import {
  buildCompletedOrderAccess,
  getCompletedOrderLookupRequestOptions,
  getCustomerCompletedOrderLookupRequestOptions,
} from './completed-order-access'

describe('completed order access', () => {
  it('stores the completed order token from the order resource before falling back to the cart token', () => {
    expect(
      buildCompletedOrderAccess({
        fallbackToken: 'cart-token',
        order: {
          id: 'or_123',
          token: 'order-token',
        },
        orderIds: ['cart_123'],
      }),
    ).toEqual({
      orderIds: ['cart_123', 'or_123'],
      orderToken: 'order-token',
    })
  })

  it('falls back to the cart token when the completed order resource has no token', () => {
    expect(
      buildCompletedOrderAccess({
        fallbackToken: 'cart-token',
        order: {
          id: 'or_123',
        },
        orderIds: ['cart_123'],
      }),
    ).toEqual({
      orderIds: ['cart_123', 'or_123'],
      orderToken: 'cart-token',
    })
  })

  it('looks up guest completed orders with only the completed order token', () => {
    expect(getCompletedOrderLookupRequestOptions('order-token')).toEqual({
      spreeToken: 'order-token',
    })
  })

  it('looks up customer completed orders with only the customer token', () => {
    expect(
      getCustomerCompletedOrderLookupRequestOptions('customer-token'),
    ).toEqual({
      token: 'customer-token',
    })
  })
})
