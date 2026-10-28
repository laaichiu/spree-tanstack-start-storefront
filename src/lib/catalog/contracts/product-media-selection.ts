import type { ProductImage } from './product'

export function getVisibleProductImagesForVariant(
  images: ProductImage[],
  selectedVariantId: string | null,
) {
  if (!selectedVariantId) {
    return images
  }

  const variantSpecificImages = images.filter((image) =>
    image.variantIds.includes(selectedVariantId),
  )

  if (variantSpecificImages.length > 0) {
    return variantSpecificImages
  }

  const sharedProductImages = images.filter(
    (image) => image.variantIds.length === 0,
  )

  if (sharedProductImages.length > 0) {
    return sharedProductImages
  }

  return []
}
