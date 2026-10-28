import { readPublicBuildEnv } from '@/lib/env/public'

function getConfiguredStorefrontUrl() {
  return readPublicBuildEnv({
    VITE_STOREFRONT_URL: import.meta.env.VITE_STOREFRONT_URL,
  }).storefrontUrl
}

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value)

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null
    }

    return url
  } catch {
    return null
  }
}

function normalizeStorefrontUrl(value: string) {
  const url = parseHttpUrl(value)

  if (!url) {
    return null
  }

  try {
    url.hash = ''
    url.search = ''

    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

export function buildCanonicalUrl(
  path: string,
  storefrontUrl = getConfiguredStorefrontUrl(),
) {
  const baseUrl = storefrontUrl ? normalizeStorefrontUrl(storefrontUrl) : null

  if (!baseUrl) {
    return null
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  try {
    const url = new URL(`${baseUrl}${normalizedPath}`)

    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function buildSeoImageUrl(
  source: string | null | undefined,
  storefrontUrl = getConfiguredStorefrontUrl(),
) {
  const trimmedSource = source?.trim()

  if (!trimmedSource) {
    return null
  }

  try {
    const absoluteSource = new URL(trimmedSource)

    return parseHttpUrl(absoluteSource.toString())?.toString() ?? null
  } catch {
    return buildCanonicalUrl(trimmedSource, storefrontUrl)
  }
}
