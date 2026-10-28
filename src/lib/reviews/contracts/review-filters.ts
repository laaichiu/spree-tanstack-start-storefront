import type { ProductReviewQuery } from './product-review'

export function getReviewFilterValue(
  query: ProductReviewQuery,
  filterId: string,
) {
  if (filterId === 'rating') {
    return query.ratings[0] ?? ''
  }

  if (filterId === 'with_images') {
    return query.withImages ? 'true' : ''
  }

  return query.answerFilters[filterId]?.[0] ?? ''
}

export function setReviewFilterValue(
  query: ProductReviewQuery,
  filterId: string,
  value: string,
): ProductReviewQuery {
  if (filterId === 'rating') {
    return { ...query, page: 1, ratings: value ? [value] : [] }
  }

  if (filterId === 'with_images') {
    return { ...query, page: 1, withImages: value === 'true' }
  }

  const answerFilters = { ...query.answerFilters }

  if (value) {
    answerFilters[filterId] = [value]
  } else {
    delete answerFilters[filterId]
  }

  return { ...query, answerFilters, page: 1 }
}

export function clearReviewFilters(query: ProductReviewQuery) {
  return {
    ...query,
    answerFilters: {},
    page: 1,
    ratings: [],
    verifiedPurchase: false,
    withImages: false,
  }
}

export function selectedReviewFilterCount(query: ProductReviewQuery) {
  return (
    query.ratings.length +
    Number(query.withImages) +
    Object.values(query.answerFilters).filter(
      (values) => (values?.length ?? 0) > 0,
    ).length
  )
}
