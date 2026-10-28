import { describe, expect, it } from 'vitest'

import { readCartMutationErrorMessage } from './cart-errors'

describe('cart mutation error messages', () => {
  it('hides cart identities and fingerprint conflicts', () => {
    const fallback = 'The cart could not be updated.'

    expect(
      readCartMutationErrorMessage(
        new Error('Cart cart_abc123 was rejected.'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readCartMutationErrorMessage(
        new Error('Fingerprint has already been taken.'),
        fallback,
      ),
    ).toBe(fallback)
  })

  it('keeps safe user-facing validation text', () => {
    expect(
      readCartMutationErrorMessage(
        'The requested quantity is unavailable.',
        'The cart could not be updated.',
      ),
    ).toBe('The requested quantity is unavailable.')
  })
})
