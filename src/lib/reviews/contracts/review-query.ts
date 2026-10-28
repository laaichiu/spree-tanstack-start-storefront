import type {
  ProductReview,
  ProductReviewQuery,
  ProductReviewsPage,
  ProductReviewSort,
} from './product-review'

export function getDefaultProductReviewQuery(
  sort: ProductReviewSort,
): ProductReviewQuery {
  return {
    answerFilters: {},
    page: 1,
    ratings: [],
    sort,
    verifiedPurchase: false,
    withImages: false,
  }
}

export function isInitialProductReviewQuery(
  query: ProductReviewQuery,
  defaultSort: ProductReviewSort,
) {
  return (
    query.page === 1 &&
    query.sort === defaultSort &&
    query.ratings.length === 0 &&
    !query.withImages &&
    !query.verifiedPurchase &&
    Object.values(query.answerFilters).every(
      (values) => !values || values.length === 0,
    )
  )
}

export function cloneProductReviewQuery(
  query: ProductReviewQuery,
): ProductReviewQuery {
  return {
    ...query,
    answerFilters: Object.fromEntries(
      Object.entries(query.answerFilters).map(([key, values]) => [
        key,
        values ? [...values] : values,
      ]),
    ),
    ratings: [...query.ratings],
  }
}

export function replaceProductReview(
  page: ProductReviewsPage | undefined,
  updatedReview: ProductReview,
) {
  if (!page) {
    return page
  }

  return {
    ...page,
    reviews: page.reviews.map((review) =>
      review.id === updatedReview.id ? updatedReview : review,
    ),
  }
}
