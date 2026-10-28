import '@tanstack/react-start/server-only'

const ENABLED_VALUES = new Set(['1', 'on', 'true', 'yes'])

export function readReviewsFeatureConfig(
  input: Record<string, string | undefined>,
) {
  const value = input.VITE_STOREFRONT_REVIEWS_ENABLED?.trim().toLowerCase()

  return {
    enabled: value ? ENABLED_VALUES.has(value) : false,
  }
}

export function isReviewsFeatureEnabled() {
  return readReviewsFeatureConfig({
    VITE_STOREFRONT_REVIEWS_ENABLED: import.meta.env
      .VITE_STOREFRONT_REVIEWS_ENABLED,
  }).enabled
}
