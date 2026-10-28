// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { applyStorefrontSecurityHeaders } from './response-headers'

describe('shared storefront security headers', () => {
  it('applies browser security headers and HTTPS transport policy', () => {
    const response = applyStorefrontSecurityHeaders(new Response('ok'), {
      contentSecurityPolicy: "default-src 'self'",
      requestUrl: 'https://shop.example.com',
    })

    expect(response.headers.get('Content-Security-Policy')).toBe(
      "default-src 'self'",
    )
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), geolocation=(), microphone=()',
    )
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains',
    )
  })

  it('does not send HSTS over local HTTP', () => {
    const response = applyStorefrontSecurityHeaders(new Response('ok'), {
      contentSecurityPolicy: "default-src 'self'",
      requestUrl: 'http://localhost:3007',
    })

    expect(response.headers.get('Strict-Transport-Security')).toBeNull()
  })
})
