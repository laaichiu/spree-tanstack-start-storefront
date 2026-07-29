import { useMarket } from '@/components/layout/market-provider'
import type { ProductGalleryController } from '@/components/pdp/product-detail-controller'
import { ProductDetailGallery } from '@/components/pdp/product-detail-gallery'
import { ProductDetailImageZoom } from '@/components/pdp/product-detail-image-zoom'
import type { Money } from '@/lib/money/money'

type ProductGallerySectionProps = {
  compareAtPrice?: Money | null
  gallery: ProductGalleryController
  isPreorder: boolean
  price: Money | null
  productName: string
}

export function ProductGallerySection({
  compareAtPrice,
  gallery,
  isPreorder,
  price,
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
        compareAtPrice={compareAtPrice}
        isPreorder={isPreorder}
        price={price}
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
