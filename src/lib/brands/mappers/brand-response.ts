import type { Seller as SpreeSeller } from '@spree/sdk'

export const BRAND_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The public Seller response is malformed.'

export class BrandResourceTypeMismatchError extends Error {
  constructor() {
    super(BRAND_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'BrandResourceTypeMismatchError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function assertSpreeSellerResource(
  value: unknown,
): asserts value is SpreeSeller {
  if (
    !isRecord(value) ||
    !isNonBlankString(value.id) ||
    !value.id.startsWith('sel_') ||
    !isNonBlankString(value.name) ||
    !isNonBlankString(value.slug) ||
    typeof value.about !== 'string' ||
    typeof value.about_html !== 'string' ||
    !isNullableString(value.logo_url) ||
    !isNullableString(value.square_logo_url) ||
    !isNullableString(value.cover_photo_url)
  ) {
    throw new BrandResourceTypeMismatchError()
  }
}

export function assertSpreeSellerSlugMatchesRequestedSlug(
  seller: SpreeSeller,
  requestedSlug: string,
) {
  if (seller.slug !== requestedSlug) {
    throw new BrandResourceTypeMismatchError()
  }
}
