import { ChevronDown } from 'lucide-react'

import {
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRoot,
  MenuTrigger,
} from '@/components/ui/menu'
import { getFilterButtonClassName } from '@/components/plp/product-listing-filter-ui'
import { PRODUCT_LISTING_SORT_VALUES } from '@/lib/catalog/model/product-listing'
import type { ProductListingSort } from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/lib/utils'

const PRODUCT_LISTING_SORT_SET = new Set<string>(PRODUCT_LISTING_SORT_VALUES)

function isProductListingSort(value: unknown): value is ProductListingSort {
  return typeof value === 'string' && PRODUCT_LISTING_SORT_SET.has(value)
}

function getSortLabel(
  sort: ProductListingSort,
  t: (key: MessageKey) => string,
) {
  switch (sort) {
    case 'price-asc':
      return t('product.sortPriceAsc')
    case 'price-desc':
      return t('product.sortPriceDesc')
    case 'name-asc':
      return t('product.sortNameAsc')
    case 'name-desc':
      return t('product.sortNameDesc')
    case 'oldest':
      return t('product.sortOldest')
    case 'best-selling':
      return t('product.sortBestSelling')
    case 'newest':
      return t('product.sortNewest')
  }
}

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
  return (
    <MenuRoot>
      <MenuTrigger
        aria-label={t('product.sortBy')}
        className={cn(
          getFilterButtonClassName(false),
          'group shrink-0',
          className,
        )}
        type="button"
      >
        <span>{t('product.sort')}</span>
        <ChevronDown
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
        />
      </MenuTrigger>

      <MenuContent>
        <MenuRadioGroup
          aria-label={t('product.sortBy')}
          onValueChange={(nextValue) => {
            if (isProductListingSort(nextValue)) {
              onValueChange(nextValue)
            }
          }}
          value={value}
        >
          {PRODUCT_LISTING_SORT_VALUES.map((sort) => (
            <MenuRadioItem key={sort} value={sort}>
              {getSortLabel(sort, t)}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </MenuRoot>
  )
}
