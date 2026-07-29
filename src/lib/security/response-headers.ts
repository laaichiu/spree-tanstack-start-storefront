export const CONTENT_SECURITY_POLICY = [
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

// Kept as an alias for callers that used the audit-only name before CSP was
// enforced. The response middleware now emits the enforcing header below.
export const CONTENT_SECURITY_POLICY_REPORT_ONLY = CONTENT_SECURITY_POLICY

const PRIVATE_PATH_PATTERN =
  /(^|\/)\b(?:account|cart|checkout|confirm-payment|order-placed)\b(?:\/|$)/

type ResponseHeaderContext = {
  cspNonce?: string
  isServerFunction?: boolean
  pathname: string
  requestUrl: string
}

function getContentSecurityPolicy(cspNonce?: string) {
  if (!cspNonce) {
    return CONTENT_SECURITY_POLICY
  }

  return CONTENT_SECURITY_POLICY.replace(
    "script-src 'self'",
    `script-src 'self' 'nonce-${cspNonce}'`,
  )
}

export function isPrivateStorefrontPath(pathname: string) {
  return pathname.startsWith('/api/') || PRIVATE_PATH_PATTERN.test(pathname)
}

export function applyStorefrontResponseHeaders(
  response: Response,
  {
    cspNonce,
    isServerFunction = false,
    pathname,
    requestUrl,
  }: ResponseHeaderContext,
) {
  response.headers.set(
    'Content-Security-Policy',
    getContentSecurityPolicy(cspNonce),
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
