import { Fragment } from 'react'
import type { ReactNode } from 'react'

import type {
  CatalogProductReference,
  HomeSectionStatus,
} from '@/lib/catalog/contracts'
import { FeaturedProductsDesktopCarouselView } from './featured-products-desktop-carousel-view'
import { FeaturedProductsMobileCarouselView } from './featured-products-mobile-carousel-view'
import { FeaturedProductsSectionView } from './featured-products-section-view'
import { HomeSectionMessageView } from './home-section-message-view'

export type HomeFeaturedProductsLabels = {
  emptyDescription: string
  emptyTitle: string
  errorDescription: string
  errorTitle: string
  nextLabel: string
  previousLabel: string
  title: string
  viewAll: string
}

type ProductLinkRenderer = (content: ReactNode, className?: string) => ReactNode

type HomeFeaturedProductsViewProps<
  TProduct extends CatalogProductReference = CatalogProductReference,
> = {
  labels: HomeFeaturedProductsLabels
  products: readonly TProduct[]
  renderProductCard: (options: {
    product: TProduct
    renderProductLink: ProductLinkRenderer
  }) => ReactNode
  renderProductLink: (
    product: TProduct,
    content: ReactNode,
    className?: string,
  ) => ReactNode
  renderProductsLink: ProductLinkRenderer
  status: HomeSectionStatus
}

export function HomeFeaturedProductsView<
  TProduct extends CatalogProductReference = CatalogProductReference,
>({
  labels,
  products,
  renderProductCard,
  renderProductLink,
  renderProductsLink,
  status,
}: HomeFeaturedProductsViewProps<TProduct>) {
  const productIdsKey = JSON.stringify(products.map((product) => product.id))

  function renderCard(product: TProduct) {
    return renderProductCard({
      product,
      renderProductLink: (content, className) =>
        renderProductLink(product, content, className),
    })
  }

  let content: ReactNode

  if (status === 'ready') {
    const cards = products.map((product) => (
      <Fragment key={product.id}>{renderCard(product)}</Fragment>
    ))

    content = (
      <div className="mb-4">
        <FeaturedProductsDesktopCarouselView
          cards={cards}
          key={`desktop:${productIdsKey}`}
          nextPageLabel={labels.nextLabel}
          previousPageLabel={labels.previousLabel}
        />
        <FeaturedProductsMobileCarouselView
          key={`mobile:${productIdsKey}`}
          products={products}
          renderCard={renderCard}
        />
      </div>
    )
  } else if (status === 'empty') {
    content = (
      <HomeSectionMessageView
        description={labels.emptyDescription}
        title={labels.emptyTitle}
      />
    )
  } else {
    content = (
      <HomeSectionMessageView
        description={labels.errorDescription}
        title={labels.errorTitle}
      />
    )
  }

  return (
    <FeaturedProductsSectionView
      content={content}
      renderViewAll={renderProductsLink}
      title={labels.title}
      viewAllLabel={labels.viewAll}
    />
  )
}
