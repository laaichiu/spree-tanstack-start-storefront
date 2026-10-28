// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCustomerOrderSummaryResponse,
  CustomerOrderSummaryResponseTypeMismatchError,
} from './order-summary-response'

const validOrder = {
  completed_at: '2026-08-27T00:00:00Z',
  currency: 'USD',
  total: '10.00',
  fulfillment_status: 'fulfilled',
  id: 'or_requested',
  market_id: 'market-us',
  number: 'R123',
  payment_status: 'paid',
  total_quantity: 1,
}

describe('customer order summary response boundary', () => {
  it('accepts the fields consumed by the order summary mapper and market guard', () => {
    expect(() => assertCustomerOrderSummaryResponse(validOrder)).not.toThrow()
  })

  it.each([
    ['completed at', { completed_at: 123 }],
    ['currency', { currency: null }],
    ['total', { total: 10 }],
    ['fulfillment status', { fulfillment_status: false }],
    ['number', { number: null }],
    ['market id', { market_id: 123 }],
    ['payment status', { payment_status: {} }],
    ['total quantity', { total_quantity: '1' }],
    ['fractional total quantity', { total_quantity: 1.5 }],
    ['negative total quantity', { total_quantity: -1 }],
  ])('rejects a malformed %s field', (_field, override) => {
    expect(() =>
      assertCustomerOrderSummaryResponse({
        ...validOrder,
        ...override,
      }),
    ).toThrow(CustomerOrderSummaryResponseTypeMismatchError)
  })

  it.each([null, [], 'malformed'])(
    'rejects a malformed order response: %o',
    (response) => {
      expect(() => assertCustomerOrderSummaryResponse(response)).toThrow(
        CustomerOrderSummaryResponseTypeMismatchError,
      )
    },
  )
})
