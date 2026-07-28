type NewsletterVerificationRedirectUrlInput = {
  country: string
  locale: string
  origin?: string | null
}

const COUNTRY_SEGMENT_PATTERN = /^[a-z]{2}$/
const LOCALE_SEGMENT_PATTERN = /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/
const VERIFICATION_PATH_PATTERN =
  /^\/[a-z]{2}\/[a-z]{2}(?:-[a-z0-9]{2,8})?\/newsletter\/verify$/

function normalizeRedirectOrigin(origin: string | null | undefined) {
  const normalized = origin?.trim()

  if (!normalized) {
    return undefined
  }

  try {
    const parsed = new URL(normalized)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }

    return parsed.origin
  } catch {
    return undefined
  }
}

function normalizeCountrySegment(value: string) {
  const normalized = value.trim().toLowerCase()

  return COUNTRY_SEGMENT_PATTERN.test(normalized) ? normalized : undefined
}

function normalizeLocaleSegment(value: string) {
  const normalized = value.trim().toLowerCase()

  return LOCALE_SEGMENT_PATTERN.test(normalized) ? normalized : undefined
}

export function buildNewsletterVerificationRedirectUrl({
  country,
  locale,
  origin,
}: NewsletterVerificationRedirectUrlInput) {
  const normalizedOrigin = normalizeRedirectOrigin(origin)
  const countrySegment = normalizeCountrySegment(country)
  const localeSegment = normalizeLocaleSegment(locale)

  if (!normalizedOrigin || !countrySegment || !localeSegment) {
    return undefined
  }

  return `${normalizedOrigin}/${countrySegment}/${localeSegment}/newsletter/verify`
}

export function normalizeNewsletterVerificationRedirectUrl({
  expectedOrigin,
  redirectUrl,
}: {
  expectedOrigin?: string | null
  redirectUrl?: string | null
}) {
  const normalizedOrigin = normalizeRedirectOrigin(expectedOrigin)

  if (!redirectUrl || !normalizedOrigin) {
    return undefined
  }

  try {
    const parsed = new URL(redirectUrl.trim())
    const pathname = parsed.pathname.toLowerCase()

    if (
      parsed.origin !== normalizedOrigin ||
      !VERIFICATION_PATH_PATTERN.test(pathname)
    ) {
      return undefined
    }

    return `${parsed.origin}${pathname}`
  } catch {
    return undefined
  }
}

export function getBrowserNewsletterVerificationRedirectUrl({
  country,
  locale,
}: Pick<NewsletterVerificationRedirectUrlInput, 'country' | 'locale'>) {
  if (typeof window === 'undefined') {
    return undefined
  }

  return buildNewsletterVerificationRedirectUrl({
    country,
    locale,
    origin: window.location.origin,
  })
}
