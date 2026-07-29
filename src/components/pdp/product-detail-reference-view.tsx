import type { ProductDetailControllerValue } from '@/components/pdp/product-detail-controller'
import { ProductDetailHeading } from '@/components/pdp/product-detail-heading'
import { ProductGallerySection } from '@/components/pdp/product-gallery-section'
import { ProductPageReviews } from '@/components/pdp/product-page-reviews'
import { ProductPurchaseSection } from '@/components/pdp/product-purchase-section'
import { ProductRelatedProducts } from '@/components/pdp/product-related-products'

export function ProductDetailReferenceView({
  controller,
}: {
  controller: ProductDetailControllerValue
}) {
  const { disclosures, gallery, page, purchase } = controller
  const { product, relatedProducts, reviews } = page
  const reviewSummary = reviews?.status === 'ready' ? reviews.summary : null

  return (
    <article className="mx-auto w-full max-w-screen-2xl px-4 py-8 pb-10 lg:px-8 lg:py-8 lg:pb-14">
      <div className="space-y-5 pb-7 lg:hidden">
        <ProductDetailHeading
          compareAtPrice={purchase.activeCompareAtPrice}
          price={purchase.activePrice}
          product={product}
          reviewSummary={reviewSummary}
        />
      </div>

      <div className="mt-8 grid items-start gap-10 lg:mt-0 lg:grid-cols-3 lg:gap-8 xl:gap-10">
        <div className="lg:col-span-2">
          <ProductGallerySection
            compareAtPrice={purchase.activeCompareAtPrice}
            gallery={gallery}
            isPreorder={purchase.isPreorder}
            price={purchase.activePrice}
            productName={product.name}
          />
        </div>

        <section className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden space-y-5 pb-7 lg:block">
            <ProductDetailHeading
              compareAtPrice={purchase.activeCompareAtPrice}
              price={purchase.activePrice}
              product={product}
              reviewSummary={reviewSummary}
            />
          </div>

          <ProductPurchaseSection
            disclosures={disclosures}
            product={product}
            purchase={purchase}
          />
        </section>
      </div>

      <ProductRelatedProducts products={relatedProducts} />
      <ProductPageReviews productId={product.id} reviews={reviews} />
    </article>
  )
}
