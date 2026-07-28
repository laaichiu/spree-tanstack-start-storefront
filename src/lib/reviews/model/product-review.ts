export const PRODUCT_REVIEWS_PAGE_SIZE = 10
export const PRODUCT_REVIEW_RATINGS = [5, 4, 3, 2, 1] as const

export type ProductReviewRating = (typeof PRODUCT_REVIEW_RATINGS)[number]
export type ProductReviewSort =
  | 'most_recent'
  | 'highest_rating'
  | 'lowest_rating'
  | 'most_helpful'
export type ProductReviewVote = 'helpful' | 'not_helpful'

export type ProductReviewSummary = {
  averageRating: number
  productId: string
  ratingDistribution: Record<ProductReviewRating, number>
  reviewCount: number
}

export type ProductReviewMedia = {
  alt: string | null
  id: string
  position: number
  url: string | null
}

export type ProductReviewAnswer = {
  id: string
  label: string | null
  questionId: string
  questionKey: string
  questionLabel: string
  value: boolean | number | string | null
}

export type ProductReview = {
  answers: ProductReviewAnswer[]
  body: string
  createdAt: string
  currentVote: ProductReviewVote | null
  helpfulCount: number
  id: string
  media: ProductReviewMedia[]
  notHelpfulCount: number
  productId: string
  purchasedOptionValues: string[]
  rating: ProductReviewRating
  reviewerName: string | null
  title: string
  variantId: string | null
  verifiedPurchase: boolean
}

export type ProductReviewPagination = {
  count: number
  limit: number
  nextPage: number | null
  page: number
  pageCount: number
  previousPage: number | null
}

export type ProductReviewsPage = {
  pagination: ProductReviewPagination
  reviews: ProductReview[]
}

export type ProductReviewFilterValue = {
  count: number
  label: string
  value: string
}

export type ProductReviewFilter = {
  id: string
  label: string
  type: string
  values: ProductReviewFilterValue[]
}

export type ProductReviewFilters = {
  defaultSort: ProductReviewSort
  filters: ProductReviewFilter[]
  sortOptions: ProductReviewSort[]
}

export type ProductReviewsReadyState = {
  filters: ProductReviewFilters
  initialPage: ProductReviewsPage
  status: 'ready'
  summary: ProductReviewSummary
}

export type ProductReviewsFeatureState =
  | ProductReviewsReadyState
  | { status: 'unavailable' }

export type ProductReviewQuery = {
  answerFilters: Partial<Record<string, string[]>>
  page: number
  ratings: string[]
  sort: ProductReviewSort
  verifiedPurchase: boolean
  withImages: boolean
}

export type ProductReviewEligibility = {
  alreadyReviewed: boolean
  canReview: boolean
  eligibleOrderId: string | null
  orderId: string | null
  productId: string
  reason: string | null
  reviewId: string | null
  variantId: string | null
  verifiedPurchase: boolean
}

export type ProductReviewQuestionKind =
  | 'boolean'
  | 'multi_select'
  | 'scale'
  | 'single_select'
  | 'text'

export type ProductReviewQuestionOption = {
  id: string
  label: string
  value: string
}

export type ProductReviewQuestion = {
  filterable: boolean
  id: string
  key: string
  kind: ProductReviewQuestionKind
  label: string
  options: ProductReviewQuestionOption[]
  required: boolean
}

export type ProductReviewFormState = {
  eligibility: ProductReviewEligibility
  questions: ProductReviewQuestion[]
}

export type ProductReviewMediaUpload = {
  headers: Record<string, string>
  signedId: string
  url: string
}

export type SubmitProductReviewInput = {
  answers: Record<string, string | string[]>
  body: string
  media: Array<{ alt: string; signedId: string }>
  orderId: string
  productId: string
  rating: ProductReviewRating
  title: string
  variantId: string
}
