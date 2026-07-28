import type { ProductImage } from '../model/product'

function getVariantIds(image: ProductImage) {
  return image.variantIds
}

export function getVisibleProductImagesForVariant(
  images: ProductImage[],
  selectedVariantId: string | null,
) {
  if (!selectedVariantId) {
    return images
  }

  const variantSpecificImages = images.filter((image) =>
    getVariantIds(image).includes(selectedVariantId),
  )

  if (variantSpecificImages.length > 0) {
    return variantSpecificImages
  }

  const sharedProductImages = images.filter(
    (image) => getVariantIds(image).length === 0,
  )

  if (sharedProductImages.length > 0) {
    return sharedProductImages
  }

  return images
}
