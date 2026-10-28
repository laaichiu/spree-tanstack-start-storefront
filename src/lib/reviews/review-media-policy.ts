import { PRODUCT_REVIEW_MEDIA_CONTENT_TYPES } from '@/lib/reviews/contracts'

export const REVIEW_IMAGE_MAX_BYTES = 10 * 1024 * 1024

const REVIEW_IMAGE_TYPES = new Set<string>(PRODUCT_REVIEW_MEDIA_CONTENT_TYPES)

export function isReviewImageContentType(contentType: string) {
  return REVIEW_IMAGE_TYPES.has(contentType)
}

export function isReviewImageSizeAllowed(byteSize: number) {
  return byteSize > 0 && byteSize <= REVIEW_IMAGE_MAX_BYTES
}
