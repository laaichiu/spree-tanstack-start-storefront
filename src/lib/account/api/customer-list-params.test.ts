// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parseCustomerListParams as parseParams } from './customer-list-params'

const parseCustomerListParams = (value: unknown) =>
  parseParams(value, ['completed_at', 'created_at', 'id'] as const)

it('rejects a sort supported by another resource before making a request', () => {
  expect(() =>
    parseParams({ sort: '-completed_at' }, ['created_at', 'id'] as const),
  ).toThrow('unsupported')
})

describe('customer list params', () => {
  it('keeps the supported pagination and sort fields', () => {
    expect(
      parseCustomerListParams({
        expand: ['payments'],
        limit: 50,
        page: 2,
        sort: ' -completed_at ',
      }),
    ).toEqual({ limit: 50, page: 2, sort: '-completed_at' })
  })

  it('rejects an oversized limit before the customer API is called', () => {
    expect(() => parseCustomerListParams({ limit: 51 })).toThrow(
      'Customer list limit must be a positive integer.',
    )
  })

  it('rejects malformed pagination and sort values', () => {
    expect(() => parseCustomerListParams({ page: 0 })).toThrow(
      'Customer list page must be a positive integer.',
    )
    expect(() => parseCustomerListParams({ limit: '50' })).toThrow(
      'Customer list limit must be a positive integer.',
    )
    expect(() => parseCustomerListParams({ sort: ' ' })).toThrow(
      'Customer list sort must be a non-empty string.',
    )
  })

  it('rejects a non-object params value', () => {
    expect(() => parseCustomerListParams([])).toThrow(
      'Customer list params must be an object.',
    )
  })
})
