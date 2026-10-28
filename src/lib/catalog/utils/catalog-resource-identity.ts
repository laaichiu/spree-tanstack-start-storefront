export const CATALOG_PRODUCT_RESOURCE_ID_MISMATCH_MESSAGE =
  'The product response does not match the requested product.'
export const CATALOG_PRODUCT_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a product resource.'
export const CATALOG_VARIANT_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The nested response is not a variant resource.'
export const CATALOG_VARIANT_PRODUCT_ID_MISMATCH_MESSAGE =
  'The nested variant does not belong to the requested product.'
export const CATALOG_MEDIA_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The nested response is not a media resource.'
export const CATALOG_MEDIA_PRODUCT_ID_MISMATCH_MESSAGE =
  'The nested media does not belong to the requested product.'
export const CATALOG_MEDIA_VARIANT_ID_MISMATCH_MESSAGE =
  'The nested media variant does not belong to the requested product.'
export const CATALOG_DEFAULT_VARIANT_ID_MISMATCH_MESSAGE =
  'The product default variant does not match the requested product.'
export const CATALOG_CATEGORY_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a category resource.'
export const CATALOG_CATEGORY_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The catalog category response is malformed.'

export class CatalogProductResourceTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_PRODUCT_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogProductResourceTypeMismatchError'
  }
}

export class CatalogVariantResourceTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_VARIANT_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogVariantResourceTypeMismatchError'
  }
}

export class CatalogVariantProductIdMismatchError extends Error {
  constructor() {
    super(CATALOG_VARIANT_PRODUCT_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogVariantProductIdMismatchError'
  }
}

export class CatalogMediaResourceTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_MEDIA_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogMediaResourceTypeMismatchError'
  }
}

export class CatalogMediaProductIdMismatchError extends Error {
  constructor() {
    super(CATALOG_MEDIA_PRODUCT_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogMediaProductIdMismatchError'
  }
}

export class CatalogMediaVariantIdMismatchError extends Error {
  constructor() {
    super(CATALOG_MEDIA_VARIANT_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogMediaVariantIdMismatchError'
  }
}

export class CatalogDefaultVariantIdMismatchError extends Error {
  constructor() {
    super(CATALOG_DEFAULT_VARIANT_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogDefaultVariantIdMismatchError'
  }
}

export class CatalogCategoryResourceTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_CATEGORY_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogCategoryResourceTypeMismatchError'
  }
}

export class CatalogCategoryResponseTypeMismatchError extends Error {
  constructor() {
    super(CATALOG_CATEGORY_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CatalogCategoryResponseTypeMismatchError'
  }
}

export const CATALOG_CATEGORY_PARENT_ID_MISMATCH_MESSAGE =
  'The nested category does not belong to its parent category.'

export const CATALOG_CATEGORY_ANCESTOR_CHAIN_MISMATCH_MESSAGE =
  'The category ancestors do not match its parent chain.'

export class CatalogCategoryParentIdMismatchError extends Error {
  constructor() {
    super(CATALOG_CATEGORY_PARENT_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogCategoryParentIdMismatchError'
  }
}

export class CatalogCategoryAncestorChainMismatchError extends Error {
  constructor() {
    super(CATALOG_CATEGORY_ANCESTOR_CHAIN_MISMATCH_MESSAGE)
    this.name = 'CatalogCategoryAncestorChainMismatchError'
  }
}

export class CatalogProductResourceIdentityMismatchError extends Error {
  constructor() {
    super(CATALOG_PRODUCT_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogProductResourceIdentityMismatchError'
  }
}

export function isCatalogProductResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('prod_') &&
    value.length > 'prod_'.length
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0
}

function isNullableCategoryResourceId(value: unknown): value is string | null {
  return value === null || isCatalogCategoryResourceId(value)
}

function isCategoryResponse(value: unknown) {
  return (
    isRecord(value) &&
    isCatalogCategoryResourceId(value.id) &&
    isNonBlankString(value.name) &&
    isNonBlankString(value.permalink) &&
    isFiniteNumber(value.position) &&
    isNonNegativeInteger(value.depth) &&
    isNullableString(value.meta_title) &&
    isNullableString(value.meta_description) &&
    isNullableString(value.meta_keywords) &&
    isNonNegativeInteger(value.children_count) &&
    isNullableCategoryResourceId(value.parent_id) &&
    isString(value.description) &&
    isString(value.description_html) &&
    isNullableString(value.image_url) &&
    isNullableString(value.square_image_url) &&
    typeof value.is_root === 'boolean' &&
    typeof value.is_child === 'boolean' &&
    typeof value.is_leaf === 'boolean'
  )
}

export function assertCatalogProductResourceIsProduct(resource: unknown) {
  if (!isRecord(resource) || !isCatalogProductResourceId(resource.id)) {
    throw new CatalogProductResourceTypeMismatchError()
  }
}

export function isCatalogVariantResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('variant_') &&
    value.length > 'variant_'.length
  )
}

export function assertCatalogVariantResourceIsVariant(resource: unknown) {
  if (!isRecord(resource) || !isCatalogVariantResourceId(resource.id)) {
    throw new CatalogVariantResourceTypeMismatchError()
  }
}

export function assertCatalogVariantBelongsToProduct(
  variant: unknown,
  productId: string,
) {
  assertCatalogVariantResourceIsVariant(variant)

  if (!isRecord(variant) || variant.product_id !== productId) {
    throw new CatalogVariantProductIdMismatchError()
  }
}

export function assertCatalogProductNestedVariantsBelongToProduct(
  product: unknown,
) {
  if (!isRecord(product) || !isCatalogProductResourceId(product.id)) {
    return
  }
  const productId = product.id

  const variants = product.variants
  if (variants !== undefined && variants !== null) {
    if (!Array.isArray(variants)) {
      throw new CatalogVariantResourceTypeMismatchError()
    }

    variants.forEach((variant) =>
      assertCatalogVariantBelongsToProduct(variant, productId),
    )

    if (
      product.default_variant_id !== null &&
      product.default_variant_id !== undefined &&
      !variants.some(
        (variant) =>
          isRecord(variant) && variant.id === product.default_variant_id,
      )
    ) {
      throw new CatalogDefaultVariantIdMismatchError()
    }
  }

  const defaultVariant = product.default_variant
  if (defaultVariant === null) {
    if (
      product.default_variant_id !== null &&
      product.default_variant_id !== undefined
    ) {
      throw new CatalogDefaultVariantIdMismatchError()
    }

    return
  }

  if (defaultVariant !== undefined) {
    assertCatalogVariantBelongsToProduct(defaultVariant, productId)

    if (
      !isRecord(defaultVariant) ||
      defaultVariant.id !== product.default_variant_id
    ) {
      throw new CatalogDefaultVariantIdMismatchError()
    }
  }
}

function assertCatalogMediaBelongsToProduct(
  media: unknown,
  productId: string,
  knownVariantIds: Set<string> | null,
  expectedVariantId?: string,
) {
  if (!isRecord(media)) {
    throw new CatalogMediaResourceTypeMismatchError()
  }

  if (media.product_id !== null && media.product_id !== undefined) {
    if (media.product_id !== productId) {
      throw new CatalogMediaProductIdMismatchError()
    }
  }

  if (!Array.isArray(media.variant_ids)) {
    throw new CatalogMediaResourceTypeMismatchError()
  }

  const variantIds = media.variant_ids
  if (!variantIds.every(isCatalogVariantResourceId)) {
    throw new CatalogMediaResourceTypeMismatchError()
  }

  if (expectedVariantId && !variantIds.includes(expectedVariantId)) {
    throw new CatalogMediaVariantIdMismatchError()
  }

  if (knownVariantIds) {
    variantIds.forEach((variantId) => {
      if (!knownVariantIds.has(variantId)) {
        throw new CatalogMediaVariantIdMismatchError()
      }
    })
  }
}

export function assertCatalogProductNestedMediaBelongToProduct(
  product: unknown,
) {
  if (!isRecord(product) || !isCatalogProductResourceId(product.id)) {
    return
  }

  const productId = product.id
  const expandedVariants = Array.isArray(product.variants)
    ? product.variants
    : null
  const knownVariantIds = expandedVariants
    ? new Set<string>(
        expandedVariants.flatMap((variant: unknown) =>
          isRecord(variant) && isCatalogVariantResourceId(variant.id)
            ? [variant.id]
            : [],
        ),
      )
    : null
  const variantsWithMedia = [...(expandedVariants ?? [])]
  const defaultVariant = product.default_variant
  if (isRecord(defaultVariant)) {
    const defaultVariantId = defaultVariant.id
    if (
      isCatalogVariantResourceId(defaultVariantId) &&
      !knownVariantIds?.has(defaultVariantId)
    ) {
      variantsWithMedia.push(defaultVariant)
    }
  }

  const productMedia = [
    product.primary_media,
    ...(Array.isArray(product.media) ? product.media : []),
  ]

  productMedia.forEach((media) => {
    if (media !== undefined && media !== null) {
      assertCatalogMediaBelongsToProduct(media, productId, knownVariantIds)
    }
  })

  if (variantsWithMedia.length === 0) {
    return
  }

  variantsWithMedia.forEach((variant: unknown) => {
    if (!isRecord(variant)) {
      return
    }
    const variantId = variant.id
    if (!isCatalogVariantResourceId(variantId)) {
      return
    }

    const variantMedia = [
      variant.primary_media,
      ...(Array.isArray(variant.media) ? variant.media : []),
    ]

    variantMedia.forEach((media) => {
      if (media !== undefined && media !== null) {
        assertCatalogMediaBelongsToProduct(
          media,
          productId,
          knownVariantIds,
          variantId,
        )
      }
    })
  })
}

export function assertCatalogProductNestedCategoriesAreCategories(
  product: unknown,
) {
  if (!isRecord(product) || !isCatalogProductResourceId(product.id)) {
    return
  }

  const categories = product.categories
  if (categories !== undefined && categories !== null) {
    assertCatalogCategoryTreeResourcesAreCategories(categories)
  }
}

export function assertCatalogCategoryTreeResourcesAreCategories(
  categories: unknown,
) {
  if (!Array.isArray(categories)) {
    throw new CatalogCategoryResourceTypeMismatchError()
  }

  categories.forEach(assertCatalogCategoryTreeResourceIsCategory)
}

export function assertCatalogCategoryTreeResourceIsCategory(category: unknown) {
  assertCatalogCategoryResponse(category)

  if (!isRecord(category)) {
    return
  }

  const ancestors = category.ancestors
  if (ancestors !== undefined && ancestors !== null) {
    if (!Array.isArray(ancestors)) {
      throw new CatalogCategoryResourceTypeMismatchError()
    }

    let expectedParentId: string | null = null

    ancestors.forEach((ancestor) => {
      assertCatalogCategoryResponse(ancestor)

      const ancestorId = ancestor.id
      if (
        !isCatalogCategoryResourceId(ancestorId) ||
        ancestor.parent_id !== expectedParentId
      ) {
        throw new CatalogCategoryAncestorChainMismatchError()
      }

      expectedParentId = ancestorId
    })

    if (category.parent_id !== expectedParentId) {
      throw new CatalogCategoryAncestorChainMismatchError()
    }
  }

  const children = category.children
  if (children === undefined || children === null) {
    return
  }

  if (!Array.isArray(children)) {
    throw new CatalogCategoryResourceTypeMismatchError()
  }

  children.forEach((child) => {
    assertCatalogCategoryTreeResourceIsCategory(child)

    if (!isRecord(child) || child.parent_id !== category.id) {
      throw new CatalogCategoryParentIdMismatchError()
    }
  })
}

export function isCatalogCategoryResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('ctg_') &&
    value.length > 'ctg_'.length
  )
}

export function assertCatalogCategoryResourceIsCategory(resource: unknown) {
  if (!isRecord(resource) || !isCatalogCategoryResourceId(resource.id)) {
    throw new CatalogCategoryResourceTypeMismatchError()
  }
}

export function assertCatalogCategoryResponse(
  response: unknown,
): asserts response is Record<string, unknown> {
  assertCatalogCategoryResourceIsCategory(response)

  if (!isCategoryResponse(response)) {
    throw new CatalogCategoryResponseTypeMismatchError()
  }
}

export function assertCatalogProductResourceMatchesRequestedId(
  resource: { id?: unknown },
  requestedProductId: string,
) {
  if (
    requestedProductId.startsWith('prod_') &&
    resource.id !== requestedProductId
  ) {
    throw new CatalogProductResourceIdentityMismatchError()
  }
}

export const CATALOG_CATEGORY_RESOURCE_ID_MISMATCH_MESSAGE =
  'The category response does not match the requested category.'

export class CatalogCategoryResourceIdentityMismatchError extends Error {
  constructor() {
    super(CATALOG_CATEGORY_RESOURCE_ID_MISMATCH_MESSAGE)
    this.name = 'CatalogCategoryResourceIdentityMismatchError'
  }
}

export function assertCatalogCategoryResourceMatchesRequestedId(
  resource: { id?: unknown },
  requestedCategoryId: string,
) {
  if (
    requestedCategoryId.startsWith('ctg_') &&
    resource.id !== requestedCategoryId
  ) {
    throw new CatalogCategoryResourceIdentityMismatchError()
  }
}
