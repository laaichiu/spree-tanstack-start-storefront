import { lazy, Suspense } from 'react'

import type { ProductPageModel } from '@/lib/catalog/model/product-page'

const ProductReviewsSection = lazy(async () => {
  const module = await import('@/components/reviews/product-reviews-section')

  return { default: module.ProductReviewsSection }
})

type ProductPageReviewsProps = {
  productId: string
  reviews: ProductPageModel['reviews']
}

export function ProductPageReviews({
  productId,
  reviews,
}: ProductPageReviewsProps) {
  if (!reviews) {
    return null
  }

  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="mt-14 h-48 animate-pulse bg-muted motion-reduce:animate-none lg:mt-20"
        />
      }
    >
      <ProductReviewsSection feature={reviews} productId={productId} />
    </Suspense>
  )
}
