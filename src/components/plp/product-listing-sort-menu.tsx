import {
  isProductListingSort,
  PRODUCT_LISTING_SORT_VALUES,
} from '@/lib/catalog/contracts'
import type { ProductListingSort } from '@/lib/catalog/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { getProductListingSortDisplays } from './product-listing-filter-toolbar-model'
import { ProductListingSortMenuView } from './product-listing-sort-menu-view'

export function ProductListingSortMenu({
  className,
  onValueChange,
  t,
  value,
}: {
  className?: string
  onValueChange: (value: ProductListingSort) => void
  t: (key: MessageKey) => string
  value: ProductListingSort
}) {
  const sortLabels = {
    'best-selling': t('product.sortBestSelling'),
    'name-asc': t('product.sortNameAsc'),
    'name-desc': t('product.sortNameDesc'),
    newest: t('product.sortNewest'),
    oldest: t('product.sortOldest'),
    'price-asc': t('product.sortPriceAsc'),
    'price-desc': t('product.sortPriceDesc'),
  } satisfies Record<ProductListingSort, string>

  return (
    <ProductListingSortMenuView
      ariaLabel={t('product.sortBy')}
      className={className}
      label={sortLabels[value]}
      onValueChange={(nextValue) => {
        if (isProductListingSort(nextValue)) {
          onValueChange(nextValue)
        }
      }}
      options={getProductListingSortDisplays(
        PRODUCT_LISTING_SORT_VALUES,
        sortLabels,
      )}
      value={value}
    />
  )
}
