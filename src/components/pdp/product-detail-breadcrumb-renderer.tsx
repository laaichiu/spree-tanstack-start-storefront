import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { ProductCategoryBreadcrumb } from '@/lib/catalog/contracts'
import type { CatalogBreadcrumbLink } from '@/components/contracts/catalog'

type ProductDetailBreadcrumbRendererOptions = {
  categoryBreadcrumbs: ProductCategoryBreadcrumb[]
  marketParams: { country: string; locale: string }
}

export function createProductDetailBreadcrumbRenderer({
  categoryBreadcrumbs,
  marketParams,
}: ProductDetailBreadcrumbRendererOptions): CatalogBreadcrumbLink {
  const categoriesById = new Map(
    categoryBreadcrumbs.map((category) => [category.id, category]),
  )

  return (breadcrumb, { children, className }) => {
    if (breadcrumb.id === 'home') {
      return (
        <Link
          className={className}
          params={marketParams}
          to="/$country/$locale"
        >
          {children}
        </Link>
      )
    }

    if (breadcrumb.id === 'products') {
      return (
        <Link
          className={className}
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {children}
        </Link>
      )
    }

    const category = categoriesById.get(breadcrumb.id)

    return category ? (
      <Link
        className={className}
        params={{ ...marketParams, _splat: category.permalink }}
        search={DEFAULT_PRODUCT_LISTING_SEARCH}
        to="/$country/$locale/collections/$"
      >
        {children}
      </Link>
    ) : (
      children
    )
  }
}

export type { ProductDetailBreadcrumbRendererOptions }
