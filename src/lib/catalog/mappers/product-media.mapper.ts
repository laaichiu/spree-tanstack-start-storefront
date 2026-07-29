import type { Media as SpreeMedia, Product as SpreeProduct } from '@spree/sdk'

import type { ProductImage } from '../model/product'

export function mergeProductImages(images: ProductImage[]): ProductImage[] {
  const imagesBySource = new Map<string, ProductImage>()

  for (const image of images) {
    const existingImage = imagesBySource.get(image.src)

    if (!existingImage) {
      imagesBySource.set(image.src, image)
      continue
    }

    const variantIds = Array.from(
      new Set([...existingImage.variantIds, ...image.variantIds]),
    )

    imagesBySource.set(image.src, {
      ...existingImage,
      variantIds,
    })
  }

  return Array.from(imagesBySource.values())
}

export function mapProductImage(
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

export function mapProductImages(product: SpreeProduct): ProductImage[] {
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

  const dedupedImages = mergeProductImages(images)

  return dedupedImages.length > 0
    ? dedupedImages
    : [mapProductImage(null, product)].filter(
        (image): image is ProductImage => image !== null,
      )
}
