import { Link } from '@tanstack/react-router'

import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  getProductListingResultsState,
} from '@/lib/catalog/contracts'
import type { ProductListingPageModel } from '@/lib/catalog/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/components/ui/utils'
import { CatalogProductCard } from '@/components/catalog/catalog-product-card'
import { getCatalogBreadcrumbDisplays } from '@/components/catalog/catalog-breadcrumb-display'
import { EmptyStateView } from '@/components/shared/empty-state-view'
import type { ProductListingControllerValue } from './product-listing-controller'
import { ProductListingControls } from './product-listing-controls'
import { ProductListingHeadingView } from './product-listing-heading-view'
import { ProductListingPaginationView } from './product-listing-pagination-view'
import { ProductListingResultsView } from './product-listing-results-view'
import type {
  CatalogBreadcrumbLink,
  ProductListingHeadingModel,
} from '@/components/contracts/catalog'

type ProductListingPageViewProps = {
  attribution?: string
  controller: ProductListingControllerValue
  heading?: ProductListingHeadingModel
  market: { country: string; locale: string }
  renderBreadcrumb?: CatalogBreadcrumbLink
  showHeading?: boolean
  t: (key: MessageKey) => string
}

/** Complete product-listing composition for the current storefront. */
export function ProductListingPageView({
  attribution,
  controller,
  heading,
  market,
  renderBreadcrumb,
  showHeading = true,
  t,
}: ProductListingPageViewProps) {
  const { page, pagination } = controller
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const categoryBreadcrumbs = page.category?.breadcrumbs ?? []
  const headingModel =
    heading ??
    buildDefaultHeadingModel({
      page,
      breadcrumbHomeLabel: t('product.breadcrumbHome'),
      breadcrumbLabel: t('product.breadcrumbs'),
    })
  const hasControls = page.status === 'ready'
  const cardLabels = {
    discount: (percent: number) =>
      t('product.discount').replace('{percent}', String(percent)),
    imageFallback: t('product.imageComingSoon'),
    outOfStock: t('product.outOfStock'),
    preorder: t('product.preorder'),
  }

  const emptyState = (
    <EmptyStateView
      capabilities={{
        renderAction: (content, className) => (
          <Link
            className={className}
            params={marketParams}
            to="/$country/$locale"
          >
            {content}
          </Link>
        ),
      }}
      model={{
        actionLabel: t('product.backToHome'),
        description: page.search.q
          ? t('product.tryAnotherSearch')
          : t('product.noProductsDescription'),
        title: t('product.noProductsFound'),
      }}
    />
  )
  const errorState = (
    <EmptyStateView
      model={{
        description: t('product.productsLoadFailedDescription'),
        title: t('product.productsLoadFailed'),
      }}
    />
  )
  const productContent = (
    <div className="grid items-stretch grid-cols-2 gap-x-2 gap-y-8 pb-16 md:grid-cols-3 xl:grid-cols-4">
      {page.products.map((product, index) => (
        <CatalogProductCard
          attribution={attribution}
          key={product.id}
          labels={cardLabels}
          locale={market.locale}
          priority={index === 0}
          product={product}
          renderProductLink={(content, className) => (
            <Link
              aria-label={`View ${product.name}`}
              className={className}
              params={{ ...marketParams, slug: product.slug }}
              to="/$country/$locale/products/$slug"
            >
              {content}
            </Link>
          )}
          variant="listing"
        />
      ))}
    </div>
  )

  const renderHeadingBreadcrumb: CatalogBreadcrumbLink =
    renderBreadcrumb ??
    ((breadcrumb, props) => {
      if (breadcrumb.id === 'home') {
        return (
          <Link
            className={props.className}
            params={marketParams}
            to="/$country/$locale"
          >
            {props.children}
          </Link>
        )
      }

      const category = categoryBreadcrumbs.find(
        (item) => item.id === breadcrumb.id,
      )

      return category ? (
        <Link
          className={props.className}
          params={{ ...marketParams, _splat: category.permalink }}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/collections/$"
        >
          {props.children}
        </Link>
      ) : (
        props.children
      )
    })

  return (
    <section
      className={cn(
        'w-full px-4 pb-6 lg:px-8',
        !showHeading || headingModel.isCategoryPage
          ? 'pt-0'
          : hasControls
            ? 'pt-2 md:pt-6'
            : 'pt-6',
      )}
    >
      {showHeading ? (
        <ProductListingHeadingView
          model={headingModel}
          renderBreadcrumb={renderHeadingBreadcrumb}
        />
      ) : null}

      {hasControls ? (
        <ProductListingControls
          filters={page.filters}
          onApply={controller.applySearch}
          search={page.search}
        />
      ) : null}

      <div className="mt-8 space-y-8">
        <ProductListingResultsView
          state={getProductListingResultsState(page)}
          slots={{
            empty: emptyState,
            error: errorState,
            product: productContent,
          }}
        />
        {pagination.rangeLabel ? (
          <ProductListingPaginationView
            actions={{
              next: pagination.goToNext,
              previous: pagination.goToPrevious,
            }}
            model={{
              canGoNext: pagination.canGoNext,
              canGoPrevious: pagination.canGoPrevious,
              nextPageLabel: t('product.nextPage'),
              pageLabel: pagination.pageLabel,
              previousPageLabel: t('product.previousPage'),
              rangeLabel: pagination.rangeLabel,
              totalPages: pagination.totalPages,
            }}
          />
        ) : null}
      </div>
    </section>
  )
}

function buildDefaultHeadingModel({
  breadcrumbHomeLabel,
  breadcrumbLabel,
  page,
}: {
  breadcrumbHomeLabel: string
  breadcrumbLabel: string
  page: ProductListingPageModel
}): ProductListingHeadingModel {
  const category = page.category
  const breadcrumbs = category?.breadcrumbs ?? []

  return {
    breadcrumbLabel,
    breadcrumbs:
      breadcrumbs.length === 0
        ? []
        : [
            { id: 'home', label: breadcrumbHomeLabel },
            ...getCatalogBreadcrumbDisplays(
              breadcrumbs,
              breadcrumbs.at(-1)?.id,
            ),
          ],
    categoryImageUrl: category?.imageUrl ?? null,
    description: page.description,
    isCategoryPage: page.kind === 'collection',
    title: page.title,
  }
}
