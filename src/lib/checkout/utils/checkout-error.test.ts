import { describe, expect, it } from 'vitest'

import { readCheckoutMutationErrorMessage } from './checkout-error'

describe('checkout mutation error messages', () => {
  it('hides checkout identities and fingerprint conflicts', () => {
    const fallback = 'Checkout could not be updated.'

    expect(
      readCheckoutMutationErrorMessage(
        new Error('Payment failed for cart_abc123.'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readCheckoutMutationErrorMessage(
        new Error('Fingerprint has already been taken.'),
        fallback,
      ),
    ).toBe(fallback)
  })

  it('keeps safe user-facing validation text', () => {
    expect(
      readCheckoutMutationErrorMessage(
        'Choose a shipping method.',
        'Checkout could not be updated.',
      ),
    ).toBe('Choose a shipping method.')
  })
})
