import { PRODUCT_REVIEWS_PAGE_SIZE } from '@/lib/reviews/contracts'
import type { ProductReviewQuery } from '@/lib/reviews/contracts'

export type ProductReviewQueryParams = Record<string, boolean | number | string>

export function toProductReviewQueryParams(
  query: ProductReviewQuery,
): ProductReviewQueryParams {
  const params: ProductReviewQueryParams = {
    limit: PRODUCT_REVIEWS_PAGE_SIZE,
    page: query.page,
    sort: query.sort,
  }

  if (query.ratings.length) {
    params.rating = query.ratings.join(',')
  }

  if (query.withImages) {
    params.with_images = true
  }

  if (query.verifiedPurchase) {
    params.verified_purchase = true
  }

  for (const [questionKey, values] of Object.entries(query.answerFilters)) {
    if (!values) {
      continue
    }

    const normalizedValues = values.map((value) => value.trim()).filter(Boolean)

    if (normalizedValues.length) {
      params[`answers[${questionKey}]`] = normalizedValues.join(',')
    }
  }

  return params
}
