import { describe, expect, it } from 'vitest'

import { parseStorefrontOrigin } from './origin'

describe('storefront origin', () => {
  it('normalizes a bare HTTP or HTTPS origin', () => {
    expect(parseStorefrontOrigin('https://shop.example.com')).toBe(
      'https://shop.example.com',
    )
    expect(parseStorefrontOrigin('http://localhost:3007')).toBe(
      'http://localhost:3007',
    )
  })

  it.each([
    'https://shop.example.com/path',
    'https://shop.example.com?preview=true',
    'https://shop.example.com#content',
    'https://user:password@shop.example.com',
  ])('rejects a non-origin URL: %s', (configuredUrl) => {
    expect(() => parseStorefrontOrigin(configuredUrl)).toThrow(
      'must be a valid HTTP or HTTPS origin',
    )
  })

  it('requires HTTPS when strict production validation is enabled', () => {
    expect(() =>
      parseStorefrontOrigin('http://shop.example.com', {
        httpsOnly: true,
        variableName: 'VITE_STOREFRONT_URL',
      }),
    ).toThrow('VITE_STOREFRONT_URL must use HTTPS in production')
  })
})
