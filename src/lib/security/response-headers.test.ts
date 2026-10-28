// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  applyStorefrontResponseHeaders,
  CONTENT_SECURITY_POLICY,
  getPublicAssetCacheControl,
  isPrivateStorefrontPath,
} from './response-headers'

describe('storefront response security', () => {
  it.each([
    '/us/en/account',
    '/us/en/cart',
    '/us/en/checkout/cart_123',
    '/us/en/confirm-payment/cart_123',
    '/us/en/order-placed/or_123',
    '/api/observability',
  ])('marks %s as private', (pathname) => {
    expect(isPrivateStorefrontPath(pathname)).toBe(true)
  })

  it('keeps public catalog paths outside the private-path matcher', () => {
    expect(isPrivateStorefrontPath('/us/en/products')).toBe(false)
    expect(isPrivateStorefrontPath('/us/en/collections/kitchen')).toBe(false)
  })

  it('separates immutable build assets from revalidated public assets', () => {
    expect(getPublicAssetCacheControl('/assets/index-Cv8JUAGl.js')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(getPublicAssetCacheControl('/favicon.ico')).toBe(
      'public, max-age=3600, stale-while-revalidate=86400',
    )
    expect(getPublicAssetCacheControl('/us/en')).toBeNull()
  })

  it('adds a request nonce and required browser security policies', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      cspNonce: 'request-nonce',
      pathname: '/us/en/products',
      requestUrl: 'https://shop.example.com/us/en/products',
    })

    expect(response.headers.get('Content-Security-Policy')).toContain(
      "script-src 'self' 'nonce-request-nonce'",
    )
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "worker-src 'self' blob:",
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

  it('allows a configured HTTP API image origin only for an HTTP storefront', () => {
    const localResponse = applyStorefrontResponseHeaders(new Response('ok'), {
      apiOrigin: 'http://localhost:3010',
      pathname: '/us/en/products',
      requestUrl: 'http://localhost:3006/us/en/products',
    })
    const productionResponse = applyStorefrontResponseHeaders(
      new Response('ok'),
      {
        apiOrigin: 'http://localhost:3010',
        pathname: '/us/en/products',
        requestUrl: 'https://shop.example.com/us/en/products',
      },
    )

    expect(localResponse.headers.get('Content-Security-Policy')).toContain(
      "img-src 'self' data: blob: https: http://localhost:3010",
    )
    expect(productionResponse.headers.get('Content-Security-Policy')).toBe(
      CONTENT_SECURITY_POLICY,
    )
  })

  it('caches public assets while keeping private routes and personalized HTML unshared', () => {
    const assetResponse = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/assets/index-Cv8JUAGl.js',
      requestUrl: 'https://shop.example.com/assets/index-Cv8JUAGl.js',
    })
    const privateResponse = applyStorefrontResponseHeaders(new Response('ok'), {
      pathname: '/us/en/cart',
      requestUrl: 'https://shop.example.com/us/en/cart',
    })
    const htmlResponse = applyStorefrontResponseHeaders(
      new Response('<main>Storefront</main>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
      {
        pathname: '/us/en/products',
        requestUrl: 'https://shop.example.com/us/en/products',
      },
    )

    expect(assetResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(privateResponse.headers.get('Cache-Control')).toBe(
      'private, no-store',
    )
    expect(htmlResponse.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('keeps server functions private and omits HSTS on local HTTP', () => {
    const response = applyStorefrontResponseHeaders(new Response('ok'), {
      isServerFunction: true,
      pathname: '/us/en/products',
      requestUrl: 'http://localhost:3006/us/en/products',
    })

    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Strict-Transport-Security')).toBeNull()
  })
})
