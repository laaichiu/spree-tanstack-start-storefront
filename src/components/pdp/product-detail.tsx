import { ProductDetailController } from '@/components/pdp/product-detail-controller'
import {
  ProductDetailBreadcrumbs,
  ProductDetailHeading,
} from '@/components/pdp/product-detail-heading'
import { ProductGallerySection } from '@/components/pdp/product-gallery-section'
import { ProductPurchaseSection } from '@/components/pdp/product-purchase-section'
import { ProductReviewContent } from '@/components/pdp/product-review-runtime'
import { useMarket } from '@/components/layout/market-provider'
import type { ProductPageModel as CoreProductPageModel } from '@/lib/catalog/contracts'
import type { ProductReviewsFeatureState } from '@/lib/reviews/contracts'
import { ProductPageView } from './product-page-view'

type ProductPageModel = CoreProductPageModel<ProductReviewsFeatureState>

type ProductDetailProps = {
  page: ProductPageModel
}

export function ProductDetail({ page }: ProductDetailProps) {
  const { market } = useMarket()
  const lifecycleKey = `${market.country}:${market.locale}:${page.product.id}`

  return <ProductDetailState key={lifecycleKey} page={page} />
}

function ProductDetailState({ page }: ProductDetailProps) {
  const { market, t } = useMarket()

  return (
    <ProductDetailController page={page}>
      {(controller) => {
        const {
          disclosures,
          gallery,
          page: controllerPage,
          purchase,
        } = controller
        const reviewSummary =
          controllerPage.reviews?.status === 'ready'
            ? controllerPage.reviews.summary
            : null
        const heading = (
          <ProductDetailHeading
            compareAtPrice={purchase.activeCompareAtPrice}
            price={purchase.activePrice}
            product={controllerPage.product}
            reviewSummary={reviewSummary}
            showBreadcrumbs={false}
          />
        )

        return (
          <ProductPageView
            labels={{
              discount: (percent) =>
                t('product.discount').replace('{percent}', String(percent)),
              imageFallback: t('product.imageComingSoon'),
              outOfStock: t('product.outOfStock'),
              preorder: t('product.preorder'),
              relatedProductsTitle: t('product.relatedProducts'),
            }}
            locale={market.locale}
            marketParams={{
              country: market.country,
              locale: market.locale,
            }}
            relatedProducts={controllerPage.relatedProducts}
            slots={{
              breadcrumbs: (
                <ProductDetailBreadcrumbs product={controllerPage.product} />
              ),
              desktopHeading: heading,
              gallery: (
                <ProductGallerySection
                  discountPercent={purchase.activeDiscountPercent}
                  gallery={gallery}
                  isPreorder={purchase.isPreorder}
                  productName={controllerPage.product.name}
                />
              ),
              mobileHeading: heading,
              purchase: (
                <ProductPurchaseSection
                  disclosures={disclosures}
                  product={controllerPage.product}
                  purchase={purchase}
                />
              ),
              reviews: (
                <ProductReviewContent
                  productId={controllerPage.product.id}
                  reviews={controllerPage.reviews}
                />
              ),
            }}
          />
        )
      }}
    </ProductDetailController>
  )
}
