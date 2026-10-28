import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { redirectToAccountLogin } from './auth-guard'

describe('account session redirect boundary', () => {
  it('preserves the protected location in the login redirect', () => {
    let redirectError: unknown

    try {
      redirectToAccountLogin(
        { country: 'us', locale: 'en' },
        {
          hash: '#orders',
          pathname: '/us/en/account/orders',
          searchStr: '?page=2',
        },
      )
    } catch (error) {
      redirectError = error
    }

    expect(isRedirect(redirectError)).toBe(true)

    if (isRedirect(redirectError)) {
      expect(redirectError.options.href).toBe(
        '/us/en/account/login?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fpage%3D2%23orders',
      )
      expect(redirectError.options.replace).toBe(true)
    }
  })
})
