type AccountRedirectParams = {
  country: string
  locale: string
}

const ACCOUNT_REDIRECT_ORIGIN = 'https://storefront.invalid'

export function resolveAccountRedirectTarget(
  params: AccountRedirectParams,
  redirectTarget?: string,
) {
  const fallback = `/${params.country}/${params.locale}/account`
  const localizedPrefix = `/${params.country}/${params.locale}`
  const allowedPrefixes = [
    `${localizedPrefix}/account`,
    `${localizedPrefix}/checkout`,
  ]

  if (!redirectTarget || !redirectTarget.startsWith('/')) {
    return fallback
  }

  if (redirectTarget.startsWith('//') || redirectTarget.includes('\\')) {
    return fallback
  }

  let targetUrl: URL

  try {
    targetUrl = new URL(redirectTarget, ACCOUNT_REDIRECT_ORIGIN)
  } catch {
    return fallback
  }

  if (
    targetUrl.origin !== ACCOUNT_REDIRECT_ORIGIN ||
    !allowedPrefixes.some((prefix) =>
      isSamePathOrDescendant(targetUrl.pathname, prefix),
    )
  ) {
    return fallback
  }

  return redirectTarget
}

function isSamePathOrDescendant(targetPathname: string, prefix: string) {
  return targetPathname === prefix || targetPathname.startsWith(`${prefix}/`)
}
