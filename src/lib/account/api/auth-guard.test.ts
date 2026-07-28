import { describe, expect, it } from 'vitest'

import {
  buildAccountRedirectTarget,
  getAccountLoginRedirectHref,
} from './auth-guard'

describe('account auth guard helpers', () => {
  it('preserves path, search, and hash in redirect targets', () => {
    expect(
      buildAccountRedirectTarget({
        hash: '#timeline',
        pathname: '/us/en/account/orders/R123456789',
        searchStr: '?from=email',
      }),
    ).toBe('/us/en/account/orders/R123456789?from=email#timeline')
  })

  it('builds a localized login URL with an encoded redirect target', () => {
    expect(
      getAccountLoginRedirectHref(
        {
          country: 'fr',
          locale: 'en',
        },
        {
          pathname: '/fr/en/account/addresses',
          searchStr: '?tab=saved',
        },
      ),
    ).toBe(
      '/fr/en/account/login?redirect=%2Ffr%2Fen%2Faccount%2Faddresses%3Ftab%3Dsaved',
    )
  })
})
