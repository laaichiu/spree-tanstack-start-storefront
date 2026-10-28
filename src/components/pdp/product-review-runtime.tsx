import { lazy, Suspense } from 'react'

import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import { ProductReviewsLoadingStateView } from '@/components/reviews/product-review-loading-states-view'

const ProductReviewsSection = lazy(async () => {
  const module = await import('@/components/reviews/product-reviews-section')

  return { default: module.ProductReviewsSection }
})

export function ProductReviewContent({
  productId,
  reviews,
}: {
  productId: string
  reviews: ProductReviewsFeatureState | null | undefined
}) {
  if (!reviews) {
    return null
  }

  return (
    <Suspense fallback={<ProductReviewsLoadingStateView />}>
      <ProductReviewsSection feature={reviews} productId={productId} />
    </Suspense>
  )
}
