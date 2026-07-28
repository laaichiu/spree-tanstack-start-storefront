import { useMarket } from '@/components/layout/market-provider'
import type { ProductGalleryController } from '@/components/pdp/product-detail-controller'
import { ProductDetailGallery } from '@/components/pdp/product-detail-gallery'
import { ProductDetailImageZoom } from '@/components/pdp/product-detail-image-zoom'

type ProductGallerySectionProps = {
  gallery: ProductGalleryController
  productName: string
}

export function ProductGallerySection({
  gallery,
  productName,
}: ProductGallerySectionProps) {
  const { t } = useMarket()

  return (
    <>
      <ProductDetailGallery
        hasMultipleImages={gallery.hasMultipleImages}
        images={gallery.images}
        onSelectImage={gallery.selectImage}
        onZoom={gallery.openZoom}
        productName={productName}
        safeSelectedMediaIndex={gallery.selectedIndex}
        selectedImage={gallery.selectedImage}
        t={t}
      />

      {gallery.isZoomed && gallery.selectedImage ? (
        <ProductDetailImageZoom
          images={gallery.images}
          onClose={gallery.closeZoom}
          onSelectImage={gallery.selectImage}
          selectedIndex={gallery.selectedIndex}
          t={t}
        />
      ) : null}
    </>
  )
}
