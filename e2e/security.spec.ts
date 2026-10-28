import { expect, test } from '@playwright/test'
import type { APIResponse } from '@playwright/test'

const publicRoutes = ['/us/en', '/us/en/products']
const privateRoutes = ['/us/en/account/login', '/us/en/cart', '/us/en/checkout']

function expectSecurityHeaders(response: APIResponse) {
  const headers = response.headers()

  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['permissions-policy']).toBe(
    'camera=(), geolocation=(), microphone=()',
  )
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')

  if (new URL(response.url()).protocol === 'https:') {
    expect(headers['strict-transport-security']).toContain('max-age=31536000')
  }
}

test('public HTML exposes security headers and private caching', async ({
  request,
}) => {
  for (const route of publicRoutes) {
    const response = await request.get(route)

    expect(response.status(), route).toBe(200)
    expectSecurityHeaders(response)
    expect(response.headers()['cache-control'], route).toBe('private, no-store')
  }
})

test('account, cart, and checkout HTML is never shared', async ({
  request,
}) => {
  for (const route of privateRoutes) {
    const response = await request.get(route)

    expect(response.status(), route).toBe(200)
    expectSecurityHeaders(response)
    expect(response.headers()['cache-control'], route).toBe('private, no-store')
  }
})
