import type { ProductDetailControllerValue } from '@/components/pdp/product-detail-controller'
import { ProductDetailHeading } from '@/components/pdp/product-detail-heading'
import { ProductGallerySection } from '@/components/pdp/product-gallery-section'
import { ProductPageReviews } from '@/components/pdp/product-page-reviews'
import { ProductPurchaseSection } from '@/components/pdp/product-purchase-section'
import { ProductRelatedProducts } from '@/components/pdp/product-related-products'

export function ProductDetailEditorialView({
  controller,
}: {
  controller: ProductDetailControllerValue
}) {
  const { disclosures, gallery, page, purchase } = controller
  const { product, relatedProducts, reviews } = page

  return (
    <article className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
      <header className="mx-auto max-w-3xl border-y border-border py-8 text-center lg:py-12 [&_nav]:justify-center [&_ol]:justify-center [&_section>div]:justify-center">
        <ProductDetailHeading
          compareAtPrice={purchase.activeCompareAtPrice}
          price={purchase.activePrice}
          product={product}
          reviewSummary={reviews?.status === 'ready' ? reviews.summary : null}
        />
      </header>

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.7fr)] lg:gap-16">
        <ProductGallerySection gallery={gallery} productName={product.name} />

        <aside className="border-t border-border pt-8 lg:sticky lg:top-24">
          <ProductPurchaseSection
            disclosures={disclosures}
            product={product}
            purchase={purchase}
          />
        </aside>
      </div>

      <div className="mx-auto mt-20 max-w-6xl border-t border-border pt-2">
        <ProductPageReviews productId={product.id} reviews={reviews} />
        <ProductRelatedProducts products={relatedProducts} />
      </div>
    </article>
  )
}
