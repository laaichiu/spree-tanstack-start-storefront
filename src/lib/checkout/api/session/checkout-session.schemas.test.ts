// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { checkoutCartIdSchema } from './checkout-session.schemas'

describe('checkout cart id schema', () => {
  it.each(['cart_123', 'cart_us'])('accepts a Cart resource id: %s', (id) => {
    expect(checkoutCartIdSchema.parse(id)).toBe(id)
  })

  it.each(['', 'cart_', 'or_123', 'ps_123', 'cart-current'])(
    'rejects a non-Cart resource id: %s',
    (id) => {
      expect(() => checkoutCartIdSchema.parse(id)).toThrow()
    },
  )
})
