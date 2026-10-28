export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
].join('; ')

const PRIVATE_PATH_PATTERN =
  /(^|\/)\b(?:account|cart|checkout|confirm-payment|order-placed)\b(?:\/|$)/

const HASHED_ASSET_PATH_PATTERN =
  /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:css|js|woff2?)$/i
const PUBLIC_ASSET_PATH_PATTERN =
  /^\/(?:flags\/[^/]+\.(?:svg|webp)|hero(?:-\d+)?\.(?:jpg|webp)|newsletter-popup-bg-\d+\.webp|favicon\.ico|spree\.png)$/i

const HASHED_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const PUBLIC_ASSET_CACHE_CONTROL =
  'public, max-age=3600, stale-while-revalidate=86400'

type ResponseHeaderContext = {
  apiOrigin?: string
  cspNonce?: string
  isServerFunction?: boolean
  pathname: string
  requestUrl: string
}

export type StorefrontSecurityHeaderOptions = {
  contentSecurityPolicy: string
  requestUrl: string
}

export function applyStorefrontSecurityHeaders(
  response: Response,
  { contentSecurityPolicy, requestUrl }: StorefrontSecurityHeaderOptions,
) {
  response.headers.set('Content-Security-Policy', contentSecurityPolicy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=()',
  )
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')

  if (new URL(requestUrl).protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
  }

  return response
}

function getSafeApiOrigin(apiOrigin?: string) {
  if (!apiOrigin) {
    return null
  }

  try {
    const parsedApiOrigin = new URL(apiOrigin)

    if (
      !['http:', 'https:'].includes(parsedApiOrigin.protocol) ||
      parsedApiOrigin.origin !== apiOrigin
    ) {
      return null
    }

    return parsedApiOrigin.origin
  } catch {
    return null
  }
}

function getContentSecurityPolicy(
  cspNonce: string | undefined,
  apiOrigin: string | undefined,
  requestProtocol: string,
) {
  // HTTPS media is already covered by the scheme source. Local HTTP media
  // must use the configured Spree API origin; production never adds HTTP.
  const safeApiOrigin = getSafeApiOrigin(apiOrigin)
  const canLoadConfiguredApiOrigin =
    safeApiOrigin?.startsWith('http:') && requestProtocol === 'http:'
  const imageSource = canLoadConfiguredApiOrigin
    ? `img-src 'self' data: blob: https: ${safeApiOrigin}`
    : "img-src 'self' data: blob: https:"
  const policy = CONTENT_SECURITY_POLICY.replace(
    "img-src 'self' data: blob: https:",
    imageSource,
  )

  if (!cspNonce) {
    return policy
  }

  return policy.replace(
    "script-src 'self'",
    `script-src 'self' 'nonce-${cspNonce}'`,
  )
}

export function isPrivateStorefrontPath(pathname: string) {
  return pathname.startsWith('/api/') || PRIVATE_PATH_PATTERN.test(pathname)
}

export function getPublicAssetCacheControl(pathname: string) {
  if (HASHED_ASSET_PATH_PATTERN.test(pathname)) {
    return HASHED_ASSET_CACHE_CONTROL
  }

  return PUBLIC_ASSET_PATH_PATTERN.test(pathname)
    ? PUBLIC_ASSET_CACHE_CONTROL
    : null
}

export function applyStorefrontResponseHeaders(
  response: Response,
  {
    apiOrigin,
    cspNonce,
    isServerFunction = false,
    pathname,
    requestUrl,
  }: ResponseHeaderContext,
) {
  const requestProtocol = new URL(requestUrl).protocol

  applyStorefrontSecurityHeaders(response, {
    contentSecurityPolicy: getContentSecurityPolicy(
      cspNonce,
      apiOrigin,
      requestProtocol,
    ),
    requestUrl,
  })

  if (isServerFunction || isPrivateStorefrontPath(pathname)) {
    response.headers.set('Cache-Control', 'private, no-store')
  } else {
    const assetCacheControl = getPublicAssetCacheControl(pathname)

    if (assetCacheControl) {
      response.headers.set('Cache-Control', assetCacheControl)
    } else if (response.headers.get('Content-Type')?.includes('text/html')) {
      response.headers.set('Cache-Control', 'private, no-store')
    }
  }

  return response
}
