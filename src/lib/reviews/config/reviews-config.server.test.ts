import { describe, expect, it } from 'vitest'

import { readReviewsFeatureConfig } from './reviews-config.server'

describe('readReviewsFeatureConfig', () => {
  it('keeps optional reviews disabled when the variable is absent or invalid', () => {
    expect(readReviewsFeatureConfig({}).enabled).toBe(false)
    expect(
      readReviewsFeatureConfig({ VITE_STOREFRONT_REVIEWS_ENABLED: 'enabled' })
        .enabled,
    ).toBe(false)
  })

  it.each(['1', 'true', 'TRUE', ' yes ', 'on'])(
    'enables reviews for %s',
    (value) => {
      expect(
        readReviewsFeatureConfig({ VITE_STOREFRONT_REVIEWS_ENABLED: value })
          .enabled,
      ).toBe(true)
    },
  )

  it.each(['0', 'false', 'no', 'off', ''])(
    'disables reviews for %s',
    (value) => {
      expect(
        readReviewsFeatureConfig({ VITE_STOREFRONT_REVIEWS_ENABLED: value })
          .enabled,
      ).toBe(false)
    },
  )
})
