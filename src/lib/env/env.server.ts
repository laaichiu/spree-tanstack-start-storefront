import '@tanstack/react-start/server-only'

export type ServerEnv = {
  spreeApiUrl: string
  spreePublishableKey: string
}

export function readServerEnv(input: Record<string, string | undefined>) {
  const spreeApiUrl = input.SPREE_API_URL?.trim()

  if (!spreeApiUrl) {
    throw new Error('SPREE_API_URL is required')
  }

  let parsedSpreeApiUrl: URL

  try {
    parsedSpreeApiUrl = new URL(spreeApiUrl)
  } catch {
    throw new Error('SPREE_API_URL must be a valid HTTP or HTTPS URL')
  }

  if (
    !['http:', 'https:'].includes(parsedSpreeApiUrl.protocol) ||
    !parsedSpreeApiUrl.hostname
  ) {
    throw new Error('SPREE_API_URL must be a valid HTTP or HTTPS URL')
  }

  const spreePublishableKey = input.SPREE_PUBLISHABLE_KEY?.trim()

  if (!spreePublishableKey) {
    throw new Error('SPREE_PUBLISHABLE_KEY is required')
  }

  if (!spreePublishableKey.startsWith('pk_')) {
    throw new Error(
      'SPREE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
    )
  }

  return {
    spreeApiUrl,
    spreePublishableKey,
  } satisfies ServerEnv
}
