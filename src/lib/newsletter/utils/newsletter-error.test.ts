import { describe, expect, it } from 'vitest'

import { readNewsletterErrorMessage } from './newsletter-error'

describe('newsletter error messages', () => {
  it('hides subscriber identities and keeps safe validation text', () => {
    const fallback = 'The request could not be completed.'

    expect(
      readNewsletterErrorMessage(
        new Error('Could not update subscriber_abc123.'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readNewsletterErrorMessage('Enter a valid email address.', fallback),
    ).toBe('Enter a valid email address.')
  })
})
