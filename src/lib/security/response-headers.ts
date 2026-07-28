export const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
].join('; ')

const PRIVATE_PATH_PATTERN =
  /(^|\/)\b(?:account|cart|checkout|confirm-payment|order-placed)\b(?:\/|$)/

type ResponseHeaderContext = {
  isServerFunction?: boolean
  pathname: string
  requestUrl: string
}

export function isPrivateStorefrontPath(pathname: string) {
  return pathname.startsWith('/api/') || PRIVATE_PATH_PATTERN.test(pathname)
}

export function applyStorefrontResponseHeaders(
  response: Response,
  { isServerFunction = false, pathname, requestUrl }: ResponseHeaderContext,
) {
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    CONTENT_SECURITY_POLICY_REPORT_ONLY,
  )
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

  if (isServerFunction || isPrivateStorefrontPath(pathname)) {
    response.headers.set('Cache-Control', 'private, no-store')
  }

  return response
}
