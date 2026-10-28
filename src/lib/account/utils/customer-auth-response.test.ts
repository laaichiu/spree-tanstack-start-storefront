import { describe, expect, it } from 'vitest'

import {
  assertCustomerAuthResponse,
  CustomerAuthResponseTypeMismatchError,
} from './customer-auth-response'

const validResponse = {
  refresh_token: 'refresh-token',
  token: 'access-token',
  user: {
    email: 'ada@example.com',
    first_name: 'Ada',
    id: 'cust_requested',
    last_name: 'Lovelace',
  },
}

describe('customer authentication response boundary', () => {
  it('accepts the SDK auth response shape', () => {
    expect(() => assertCustomerAuthResponse(validResponse)).not.toThrow()
  })

  it.each([
    null,
    undefined,
    [],
    'malformed',
    {},
    { ...validResponse, token: '   ' },
    { ...validResponse, refresh_token: undefined },
    { ...validResponse, user: null },
    { ...validResponse, user: { ...validResponse.user, email: undefined } },
  ])('rejects a malformed auth response: %o', (response) => {
    expect(() => assertCustomerAuthResponse(response)).toThrow(
      CustomerAuthResponseTypeMismatchError,
    )
  })
})
