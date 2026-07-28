import { describe, expect, it } from 'vitest'

import {
  applyStorefrontResponseHeaders,
  CONTENT_SECURITY_POLICY_REPORT_ONLY,
  isPrivateStorefrontPath,
} from './response-headers'

describe('storefront response headers', () => {
  it.each([
    '/us/en/account',
    '/us/en/cart',
    '/us/en/checkout/cart_123',
    '/us/en/confirm-payment/cart_123',
    '/api/observability',
  ])('marks %s as private', (pathname) => {
    expect(isPrivateStorefrontPath(pathname)).toBe(true)
  })

  it('does not mark public catalog paths as private', () => {
    expect(isPrivateStorefrontPath('/us/en/products')).toBe(false)
  })

  it('adds security headers and keeps HTTPS transport strict', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/us/en/products',
      requestUrl: 'https://shop.example.com/us/en/products',
    })

    expect(response.headers.get('Content-Security-Policy-Report-Only')).toBe(
      CONTENT_SECURITY_POLICY_REPORT_ONLY,
    )
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), geolocation=(), microphone=()',
    )
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains',
    )
    expect(response.headers.get('Cache-Control')).toBeNull()
  })

  it('does not emit HSTS on local HTTP and disables private caching', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      isServerFunction: true,
      pathname: '/us/en/products',
      requestUrl: 'http://localhost:3002/us/en/products',
    })

    expect(response.headers.get('Strict-Transport-Security')).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })
})
