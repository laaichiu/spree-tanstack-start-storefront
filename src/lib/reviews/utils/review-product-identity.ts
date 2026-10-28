export const REVIEW_PRODUCT_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The review response is not a product resource.'
export const REVIEW_PRODUCT_RESOURCE_ID_MISMATCH_MESSAGE =
  'The review response does not match the requested product.'
export const REVIEW_VARIANT_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The review response is not a variant resource.'
export const REVIEW_VARIANT_RESOURCE_ID_MISMATCH_MESSAGE =
  'The review response does not match the requested variant.'
export const REVIEW_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a review resource.'

export class ReviewProductResourceTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_PRODUCT_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewProductResourceTypeMismatchError'
  }
}

export class ReviewResourceTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewResourceTypeMismatchError'
  }
}

export class ReviewProductResourceIdentityMismatchError extends Error {
  constructor() {
    super(REVIEW_PRODUCT_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'ReviewProductResourceIdentityMismatchError'
  }
}

export class ReviewVariantResourceTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_VARIANT_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewVariantResourceTypeMismatchError'
  }
}

export class ReviewVariantResourceIdentityMismatchError extends Error {
  constructor() {
    super(REVIEW_VARIANT_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'ReviewVariantResourceIdentityMismatchError'
  }
}

export function isReviewProductResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('prod_') &&
    value.length > 'prod_'.length
  )
}

export function isReviewOrderResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('or_') &&
    value.length > 'or_'.length
  )
}

export function isReviewVariantResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('variant_') &&
    value.length > 'variant_'.length
  )
}

export function isReviewResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('rev_') &&
    value.length > 'rev_'.length
  )
}

export function isReviewMediaResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('rmedia_') &&
    value.length > 'rmedia_'.length
  )
}

export function isReviewAnswerResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('revans_') &&
    value.length > 'revans_'.length
  )
}

export function isReviewQuestionResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('revq_') &&
    value.length > 'revq_'.length
  )
}

export function isReviewQuestionOptionResourceId(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('revopt_') &&
    value.length > 'revopt_'.length
  )
}

export function assertReviewResourceIsReview(resource: { id?: unknown }) {
  if (!isReviewResourceId(resource.id)) {
    throw new ReviewResourceTypeMismatchError()
  }
}

export function assertReviewProductResourceMatchesRequestedLocator(
  resource: { productId?: unknown },
  requestedProductLocator: string,
) {
  if (!isReviewProductResourceId(resource.productId)) {
    throw new ReviewProductResourceTypeMismatchError()
  }

  // The Store API deliberately accepts either a prefixed product id or a
  // localized slug. A slug is resolved by Spree within the active store and
  // market, so only prefixed requests can be compared to the response id.
  if (
    isReviewProductResourceId(requestedProductLocator) &&
    resource.productId !== requestedProductLocator
  ) {
    throw new ReviewProductResourceIdentityMismatchError()
  }
}

export function assertReviewVariantResourceMatchesRequestedId(
  resource: { variantId?: unknown },
  requestedVariantId: string,
) {
  if (!isReviewVariantResourceId(resource.variantId)) {
    throw new ReviewVariantResourceTypeMismatchError()
  }

  if (resource.variantId !== requestedVariantId) {
    throw new ReviewVariantResourceIdentityMismatchError()
  }
}
