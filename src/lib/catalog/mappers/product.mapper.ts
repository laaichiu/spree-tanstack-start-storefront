import type {
  Category as SpreeCategory,
  CustomField as SpreeCustomField,
  Media as SpreeMedia,
  Product as SpreeProduct,
  Variant as SpreeVariant,
} from '@spree/sdk'

import type {
  Product,
  ProductCategoryBreadcrumb,
  ProductImage,
  ProductOption,
  ProductSpecification,
  ProductSummary,
  ProductVariant,
} from '../model/product'
import { mapSpreePriceToMoney } from '@/lib/money/map-spree-price'
import { isSyntheticCatalogRootCategory } from './category.mapper'

function mapProductImage(
  media: SpreeMedia | null | undefined,
  product: SpreeProduct,
): ProductImage | null {
  const src =
    media?.large_url ??
    media?.medium_url ??
    media?.small_url ??
    media?.original_url ??
    product.thumbnail_url

  if (!src) {
    return null
  }

  return {
    id: media?.id ?? `${product.id}:thumbnail`,
    src,
    alt: media?.alt ?? product.name,
    variantIds: media?.variant_ids ?? [],
  }
}

function mapProductImages(product: SpreeProduct): ProductImage[] {
  const images = product.primary_media
    ? [
        mapProductImage(product.primary_media, product),
        ...(product.media ?? []).map((media) =>
          mapProductImage(media, product),
        ),
      ].filter((image): image is ProductImage => image !== null)
    : (product.media ?? [])
        .map((media) => mapProductImage(media, product))
        .filter((image): image is ProductImage => image !== null)

  const dedupedImages = images.filter(
    (image, index, allImages) =>
      allImages.findIndex((candidate) => candidate.src === image.src) === index,
  )

  return dedupedImages.length > 0
    ? dedupedImages
    : [mapProductImage(null, product)].filter(
        (image): image is ProductImage => image !== null,
      )
}

function mapCompareAtPrice(product: SpreeProduct) {
  return product.original_price
    ? mapSpreePriceToMoney(product.original_price)
    : undefined
}

function mapVariantCompareAtPrice(variant: SpreeVariant) {
  return variant.original_price
    ? mapSpreePriceToMoney(variant.original_price)
    : undefined
}

function mapVariant(variant: SpreeVariant): ProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    price: mapSpreePriceToMoney(variant.price),
    compareAtPrice: mapVariantCompareAtPrice(variant),
    inStock: variant.in_stock && variant.purchasable,
    optionValues: variant.option_values.map((optionValue) => ({
      id: optionValue.id,
      name: optionValue.name,
      label: optionValue.label,
      colorCode: optionValue.color_code,
      imageUrl: optionValue.image_url,
      optionTypeId: optionValue.option_type_id,
      optionTypeName: optionValue.option_type_name,
      optionTypeLabel: optionValue.option_type_label,
    })),
  }
}

function mapProductOptions(variants: ProductVariant[]): ProductOption[] {
  const optionMap = new Map<string, ProductOption>()

  for (const variant of variants) {
    for (const optionValue of variant.optionValues) {
      const option = optionMap.get(optionValue.optionTypeId) ?? {
        id: optionValue.optionTypeId,
        name: optionValue.optionTypeName,
        label: optionValue.optionTypeLabel,
        values: [],
      }

      if (!option.values.some((value) => value.id === optionValue.id)) {
        option.values.push({
          id: optionValue.id,
          name: optionValue.name,
          label: optionValue.label,
          colorCode: optionValue.colorCode,
          imageUrl: optionValue.imageUrl,
        })
      }

      optionMap.set(option.id, option)
    }
  }

  return Array.from(optionMap.values())
}

function mapProductCategoryBreadcrumb(
  category: SpreeCategory,
): ProductCategoryBreadcrumb {
  return {
    id: category.id,
    name: category.name,
    permalink: category.permalink,
  }
}

function stripHtmlTags(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCustomFieldType(type: string) {
  return type.split('::').pop() ?? type
}

function formatCustomFieldValue(field: SpreeCustomField): string {
  const normalizedType = normalizeCustomFieldType(field.type)

  if (normalizedType === 'Boolean') {
    return field.value ? 'Yes' : 'No'
  }

  if (normalizedType === 'Json') {
    return typeof field.value === 'string'
      ? field.value
      : JSON.stringify(field.value)
  }

  if (field.value === null || field.value === undefined) {
    return '-'
  }

  return String(field.value)
}

function mapProductSpecifications(
  product: SpreeProduct,
): ProductSpecification[] {
  return (product.custom_fields ?? []).map((field) => {
    const normalizedType = normalizeCustomFieldType(field.type)
    const value =
      normalizedType === 'RichText' && typeof field.value === 'string'
        ? stripHtmlTags(field.value)
        : formatCustomFieldValue(field)

    return {
      label: field.label,
      value,
    }
  })
}

function mapProductCategoryBreadcrumbs(
  product: SpreeProduct,
): ProductCategoryBreadcrumb[] {
  const categories = product.categories ?? []

  if (categories.length === 0) {
    return []
  }

  const category =
    categories.find((candidate) => !candidate.is_root) ?? categories[0]

  return [
    ...(category.ancestors ?? [])
      .filter((ancestor) => !isSyntheticCatalogRootCategory(ancestor))
      .map(mapProductCategoryBreadcrumb),
    mapProductCategoryBreadcrumb(category),
  ]
}

export function mapSpreeProductToSummary(
  product: SpreeProduct,
): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    price: mapSpreePriceToMoney(product.price),
    compareAtPrice: mapCompareAtPrice(product),
    image: mapProductImage(product.primary_media, product),
    inStock: product.in_stock && product.purchasable,
  }
}

export function mapSpreeProductsToSummaries(
  products: SpreeProduct[],
): ProductSummary[] {
  return products.map(mapSpreeProductToSummary)
}

export function mapSpreeProductToProduct(product: SpreeProduct): Product {
  const variants = (product.variants ?? []).map(mapVariant)

  return {
    categoryBreadcrumbs: mapProductCategoryBreadcrumbs(product),
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? '',
    descriptionHtml: product.description_html ?? '',
    metaDescription: product.meta_description ?? product.description ?? '',
    price: mapSpreePriceToMoney(product.price),
    compareAtPrice: mapCompareAtPrice(product),
    defaultVariantId: product.default_variant_id,
    images: mapProductImages(product),
    inStock: product.in_stock && product.purchasable,
    options: mapProductOptions(variants),
    purchasable: product.purchasable,
    specifications: mapProductSpecifications(product),
    variants,
    variantCount: product.variant_count,
  }
}
