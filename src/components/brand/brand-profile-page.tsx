import { Link } from '@tanstack/react-router'

import { ProductListingPage } from '@/components/plp/product-listing-page'
import type {
  ProductListingPageModel,
  ProductListingSearch,
} from '@/lib/catalog/contracts'
import type { ProductListingHeadingModel } from '@/components/contracts/catalog/listing'
import type { BrandProfile } from '@/lib/brands/contracts'
import type { MessageKey } from '@/lib/i18n/messages'

type BrandProfilePageProps = {
  brand: BrandProfile
  marketParams: { country: string; locale: string }
  onProductsApply: (search: ProductListingSearch) => void
  productsPage: ProductListingPageModel
  t: (key: MessageKey) => string
}

export function BrandProfilePage({
  brand,
  marketParams,
  onProductsApply,
  productsPage,
  t,
}: BrandProfilePageProps) {
  const heading: ProductListingHeadingModel = {
    breadcrumbLabel: t('product.breadcrumbs'),
    breadcrumbs: [
      { id: 'home', label: t('product.breadcrumbHome') },
      { id: 'brands', label: t('brand.directory') },
      { id: 'brand', isCurrent: true, label: brand.name },
    ],
    categoryImageUrl: brand.coverPhotoUrl,
    description: brand.about || null,
    isCategoryPage: true,
    title: brand.name,
  }

  return (
    <ProductListingPage
      heading={heading}
      onApply={onProductsApply}
      page={productsPage}
      renderBreadcrumb={(breadcrumb, props) => {
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

        if (breadcrumb.id === 'brands') {
          return (
            <Link
              className={props.className}
              params={marketParams}
              to="/$country/$locale/brands"
            >
              {props.children}
            </Link>
          )
        }

        return props.children
      }}
    />
  )
}
