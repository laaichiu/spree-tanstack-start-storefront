import { describe, expect, it } from 'vitest'

import {
  CustomerSessionRequiredError,
  isCustomerSessionRequiredError,
} from './customer-session-error'

describe('customer session required error boundary', () => {
  it('recognizes the server-side error instance', () => {
    expect(
      isCustomerSessionRequiredError(new CustomerSessionRequiredError()),
    ).toBe(true)
  })

  it('recognizes the serialized server-function error code', () => {
    expect(
      isCustomerSessionRequiredError({ code: 'customer_session_required' }),
    ).toBe(true)
  })

  it('does not classify unrelated errors as session expiry', () => {
    expect(isCustomerSessionRequiredError(new Error('Network error'))).toBe(
      false,
    )
    expect(isCustomerSessionRequiredError({ code: 'forbidden' })).toBe(false)
    expect(isCustomerSessionRequiredError(null)).toBe(false)
  })
})
