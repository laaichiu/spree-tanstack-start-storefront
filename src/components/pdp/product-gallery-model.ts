import type { ProductImage } from '@/lib/catalog/contracts'

export type ProductGalleryImageDisplay = Pick<
  ProductImage,
  'alt' | 'id' | 'src' | 'srcSet'
>

export type ProductGalleryModel = {
  hasMultipleImages: boolean
  images: readonly ProductGalleryImageDisplay[]
  productName: string
  safeSelectedMediaIndex: number
  selectedImage: ProductGalleryImageDisplay | null
}

export type ProductImageZoomModel = {
  images: readonly ProductGalleryImageDisplay[]
  selectedIndex: number
}

export function getProductGalleryImagesKey(
  images: readonly Pick<ProductImage, 'id'>[],
): string {
  return images.map((image) => image.id).join('\u0000')
}

export function getProductGalleryModel({
  images,
  productName,
  selectedIndex,
}: {
  images: readonly ProductImage[]
  productName: string
  selectedIndex: number
}): ProductGalleryModel {
  const displayImages = images.map(projectProductGalleryImage)
  const safeSelectedMediaIndex = displayImages.length
    ? Math.max(0, Math.min(selectedIndex, displayImages.length - 1))
    : 0

  return {
    hasMultipleImages: displayImages.length > 1,
    images: displayImages,
    productName,
    safeSelectedMediaIndex,
    selectedImage: displayImages[safeSelectedMediaIndex] ?? null,
  }
}

export function getProductImageZoomModel(
  gallery: ProductGalleryModel,
): ProductImageZoomModel {
  return {
    images: gallery.images,
    selectedIndex: gallery.safeSelectedMediaIndex,
  }
}

function projectProductGalleryImage(
  image: ProductImage,
): ProductGalleryImageDisplay {
  return {
    alt: image.alt,
    id: image.id,
    src: image.src,
    srcSet: image.srcSet,
  }
}
