import { describe, expect, it } from 'vitest'

import { readMarketPreferenceErrorMessage } from './market-error'

describe('market preference error messages', () => {
  it('hides market identities and keeps safe selection feedback', () => {
    const fallback = 'The market could not be changed.'

    expect(
      readMarketPreferenceErrorMessage(
        new Error('Market market_abc123 is unavailable.'),
        fallback,
      ),
    ).toBe(fallback)
    expect(
      readMarketPreferenceErrorMessage(
        'This market is not available.',
        fallback,
      ),
    ).toBe('This market is not available.')
  })
})
