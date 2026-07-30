import { describe, expect, it } from 'vitest'

import {
  applyStorefrontResponseHeaders,
  CONTENT_SECURITY_POLICY,
  getPublicAssetCacheControl,
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

  it('uses immutable caching for build-hashed assets', () => {
    expect(getPublicAssetCacheControl('/assets/index-Cv8JUAGl.js')).toBe(
      'public, max-age=31536000, immutable',
    )
  })

  it('uses revalidated caching for non-hashed public assets', () => {
    expect(getPublicAssetCacheControl('/spree.png')).toBe(
      'public, max-age=3600, stale-while-revalidate=86400',
    )
    expect(getPublicAssetCacheControl('/us/en')).toBeNull()
    expect(
      getPublicAssetCacheControl('/us/en/products/example.webp'),
    ).toBeNull()
  })

  it('adds the request nonce to the enforced script policy', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      cspNonce: 'request-nonce',
      pathname: '/us/en',
      requestUrl: 'https://shop.example.com/us/en',
    })

    expect(response.headers.get('Content-Security-Policy')).toContain(
      "script-src 'self' 'nonce-request-nonce'",
    )
  })

  it('adds security headers and keeps HTTPS transport strict', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/us/en/products',
      requestUrl: 'https://shop.example.com/us/en/products',
    })

    expect(response.headers.get('Content-Security-Policy')).toBe(
      CONTENT_SECURITY_POLICY,
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

  it('caches public assets while preserving private response policy', () => {
    const assetResponse = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/assets/index-Cv8JUAGl.js',
      requestUrl: 'https://shop.example.com/assets/index-Cv8JUAGl.js',
    })

    expect(assetResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    )

    const privateResponse = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/us/en/cart',
      requestUrl: 'https://shop.example.com/us/en/cart',
    })

    expect(privateResponse.headers.get('Cache-Control')).toBe(
      'private, no-store',
    )
  })

  it('marks personalized storefront HTML as private', () => {
    const response = applyStorefrontResponseHeaders(
      new Response('<main>Storefront</main>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
      {
        pathname: '/us/en/products',
        requestUrl: 'https://shop.example.com/us/en/products',
      },
    )

    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
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
