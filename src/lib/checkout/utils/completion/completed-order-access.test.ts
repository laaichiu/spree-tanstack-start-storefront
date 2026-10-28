// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  buildCompletedOrderAccess,
  getCompletedOrderLookupRequestOptions,
  getCustomerCompletedOrderLookupRequestOptions,
} from './completed-order-access'

describe('completed-order access token boundaries', () => {
  it('trims a completed resource token before persisting access', () => {
    expect(
      buildCompletedOrderAccess({
        fallbackToken: ' fallback-token ',
        order: {
          id: 'or_completed',
          token: ' resource-token ',
        },
        orderIds: ['cart_completed'],
      }),
    ).toEqual({
      orderIds: ['cart_completed', 'or_completed'],
      orderToken: 'resource-token',
    })
  })

  it('trims the fallback token when the completed resource omits one', () => {
    expect(
      buildCompletedOrderAccess({
        fallbackToken: ' fallback-token ',
        order: {
          id: 'or_completed',
        },
        orderIds: ['cart_completed'],
      }),
    ).toEqual({
      orderIds: ['cart_completed', 'or_completed'],
      orderToken: 'fallback-token',
    })
  })

  it('normalizes the token at the lookup request boundary', () => {
    expect(getCompletedOrderLookupRequestOptions(' lookup-token ')).toEqual({
      spreeToken: 'lookup-token',
    })
    expect(
      getCustomerCompletedOrderLookupRequestOptions(' customer-token '),
    ).toEqual({
      token: 'customer-token',
    })
  })

  it('does not emit blank credentials for completed-order lookups', () => {
    expect(getCompletedOrderLookupRequestOptions('   ')).toEqual({})
    expect(getCustomerCompletedOrderLookupRequestOptions('   ')).toEqual({})
  })
})
