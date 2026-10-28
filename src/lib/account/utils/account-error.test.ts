import { describe, expect, it } from 'vitest'

import { readAccountMutationErrorMessage } from './account-error'

describe('account mutation error messages', () => {
  it('hides account resource identities and keeps safe validation text', () => {
    const fallback = 'The account could not be updated.'

    expect(
      readAccountMutationErrorMessage(
        new Error('Could not update customer_123.'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readAccountMutationErrorMessage(
        'The email address is invalid.',
        fallback,
      ),
    ).toBe('The email address is invalid.')
  })
})
