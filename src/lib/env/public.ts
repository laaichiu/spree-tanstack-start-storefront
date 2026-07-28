export type PublicBuildEnv = {
  reviewsEnabled: boolean
  storefrontUrl: string
  stripePublishableKey: string | null
}

type PublicBuildEnvOptions = {
  strictProduction?: boolean
}

const ENABLED_VALUES = new Set(['1', 'on', 'true', 'yes'])
const DISABLED_VALUES = new Set(['0', 'off', 'false', 'no'])

function readStorefrontUrl(
  input: Record<string, string | undefined>,
  strictProduction: boolean,
) {
  const configuredUrl = input.VITE_STOREFRONT_URL?.trim()

  if (!configuredUrl) {
    if (strictProduction) {
      throw new Error('VITE_STOREFRONT_URL is required for production builds')
    }

    return 'http://localhost:3002'
  }

  let url: URL

  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error('VITE_STOREFRONT_URL must be a valid HTTP or HTTPS origin')
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
    throw new Error('VITE_STOREFRONT_URL must be a valid HTTP or HTTPS origin')
  }

  if (strictProduction && url.protocol !== 'https:') {
    throw new Error('VITE_STOREFRONT_URL must use HTTPS in production')
  }

  return url.origin
}

function readStripePublishableKey(input: Record<string, string | undefined>) {
  const value = input.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ?? ''

  if (value && !/^pk_[A-Za-z0-9][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(
      'VITE_STRIPE_PUBLISHABLE_KEY must be a publishable key beginning with pk_',
    )
  }

  return value || null
}

function readReviewsEnabled(
  input: Record<string, string | undefined>,
  strictProduction: boolean,
) {
  const value = input.VITE_STOREFRONT_REVIEWS_ENABLED?.trim().toLowerCase()

  if (!value) {
    return false
  }

  if (ENABLED_VALUES.has(value)) {
    return true
  }

  if (DISABLED_VALUES.has(value)) {
    return false
  }

  if (strictProduction) {
    throw new Error(
      'VITE_STOREFRONT_REVIEWS_ENABLED must be a boolean value (true or false)',
    )
  }

  return false
}

export function readPublicBuildEnv(
  input: Record<string, string | undefined>,
  options: PublicBuildEnvOptions = {},
) {
  const strictProduction = options.strictProduction ?? false

  return {
    reviewsEnabled: readReviewsEnabled(input, strictProduction),
    storefrontUrl: readStorefrontUrl(input, strictProduction),
    stripePublishableKey: readStripePublishableKey(input),
  } satisfies PublicBuildEnv
}
