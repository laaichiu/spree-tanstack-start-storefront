export type StorefrontOriginOptions = {
  httpsOnly?: boolean
  variableName?: string
}

export function parseStorefrontOrigin(
  configuredUrl: string,
  {
    httpsOnly = false,
    variableName = 'Storefront URL',
  }: StorefrontOriginOptions = {},
) {
  let url: URL

  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error(`${variableName} must be a valid HTTP or HTTPS origin`)
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${variableName} must be a valid HTTP or HTTPS origin`)
  }

  if (httpsOnly && url.protocol !== 'https:') {
    throw new Error(`${variableName} must use HTTPS in production`)
  }

  return url.origin
}
