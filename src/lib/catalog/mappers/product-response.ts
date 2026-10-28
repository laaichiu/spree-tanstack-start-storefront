import type { Product as SpreeProduct } from '@spree/sdk'

export const CATALOG_PRODUCT_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The catalog product response is malformed.'

export class CatalogProductResponseTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_PRODUCT_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogProductResponseTypeMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNonBlankString(value: unknown): value is string {
  return isString(value) && Boolean(value.trim())
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isNullableAmount(value: unknown): value is string | null {
  return (
    value === null ||
    (isString(value) &&
      /^\d+(?:\.\d+)?$/.test(value) &&
      Number.isFinite(Number(value)))
  )
}

function isNullableNonBlankString(value: unknown): value is string | null {
  return value === null || isNonBlankString(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isPrice(value: unknown) {
  return (
    isRecord(value) &&
    isNullableAmount(value.amount) &&
    isNullableAmount(value.compare_at_amount) &&
    isNullableNonBlankString(value.currency)
  )
}

function isMedia(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isNullableString(value.product_id) &&
    Array.isArray(value.variant_ids) &&
    value.variant_ids.every(isString) &&
    isNullableString(value.alt) &&
    isNullableString(value.original_url) &&
    isNullableString(value.mini_url) &&
    isNullableString(value.small_url) &&
    isNullableString(value.medium_url) &&
    isNullableString(value.large_url)
  )
}

function isJsonValue(value: unknown): boolean {
  if (value === null) {
    return true
  }

  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  return isRecord(value) && Object.values(value).every(isJsonValue)
}

function isFiniteNumericValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    Number.isFinite(Number(value))
  )
}

function normalizedCustomFieldType(value: string): string {
  return value.split('::').pop()?.toLowerCase() ?? value.toLowerCase()
}

function isCustomFieldValue(value: unknown, fieldType: string): boolean {
  switch (normalizedCustomFieldType(fieldType)) {
    case 'boolean':
      return typeof value === 'boolean'
    case 'number':
      return isFiniteNumericValue(value)
    case 'json':
      return isJsonValue(value)
    case 'short_text':
    case 'long_text':
    case 'rich_text':
      return typeof value === 'string'
    default:
      return value !== undefined
  }
}

function isOptionValue(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isString(value.name) &&
    isString(value.label) &&
    isNonBlankString(value.option_type_id) &&
    isString(value.option_type_name) &&
    isString(value.option_type_label) &&
    isNullableString(value.color_code) &&
    isNullableString(value.image_url)
  )
}

function isVariant(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isNonBlankString(value.product_id) &&
    isNullableString(value.sku) &&
    isString(value.options_text) &&
    isNullableString(value.thumbnail_url) &&
    typeof value.in_stock === 'boolean' &&
    typeof value.backorderable === 'boolean' &&
    typeof value.purchasable === 'boolean' &&
    typeof value.preorder === 'boolean' &&
    isNullableString(value.preorder_ships_at) &&
    isPrice(value.price) &&
    (value.original_price === null || isPrice(value.original_price)) &&
    Array.isArray(value.option_values) &&
    value.option_values.every(isOptionValue) &&
    (value.primary_media === undefined ||
      value.primary_media === null ||
      isMedia(value.primary_media)) &&
    (value.media === undefined ||
      value.media === null ||
      (Array.isArray(value.media) && value.media.every(isMedia)))
  )
}

function isCustomField(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.label) &&
    isString(value.field_type) &&
    isCustomFieldValue(value.value, value.field_type)
  )
}

function isOptionalNullableArray(
  value: unknown,
  itemGuard: (item: unknown) => boolean,
) {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.every(itemGuard))
  )
}

function isProduct(value: unknown) {
  return (
    isRecord(value) &&
    isNonBlankString(value.id) &&
    isString(value.name) &&
    isNonBlankString(value.slug) &&
    isNullableString(value.meta_title) &&
    isNullableString(value.meta_description) &&
    isNullableString(value.description) &&
    isNullableString(value.description_html) &&
    isNullableString(value.thumbnail_url) &&
    (value.default_variant_id === null ||
      isNonBlankString(value.default_variant_id)) &&
    isNullableString(value.preorder_ships_at) &&
    typeof value.in_stock === 'boolean' &&
    typeof value.backorderable === 'boolean' &&
    typeof value.preorder === 'boolean' &&
    typeof value.purchasable === 'boolean' &&
    isNonNegativeInteger(value.variant_count) &&
    isPrice(value.price) &&
    (value.original_price === null || isPrice(value.original_price)) &&
    (value.primary_media === undefined ||
      value.primary_media === null ||
      isMedia(value.primary_media)) &&
    isOptionalNullableArray(value.media, isMedia) &&
    isOptionalNullableArray(value.variants, isVariant) &&
    (value.default_variant === undefined ||
      value.default_variant === null ||
      isVariant(value.default_variant)) &&
    isOptionalNullableArray(value.option_values, isOptionValue) &&
    isOptionalNullableArray(value.custom_fields, isCustomField)
  )
}

export function assertCatalogProductResponse(
  response: unknown,
): asserts response is SpreeProduct {
  if (!isProduct(response)) {
    throw new CatalogProductResponseTypeMismatchError()
  }
}
