import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { SearchPanelSection } from './search-panel-section'

export function SearchDrawerCategoryLinks({
  categories,
  onSelect,
}: {
  categories: CategoryNavigationItem[]
  onSelect: () => void
}) {
  const { market, t } = useMarket()

  if (!categories.length) {
    return null
  }

  return (
    <SearchPanelSection title={t('header.categories')}>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            className="text-sm leading-4 font-normal uppercase inline-flex min-h-9 items-center border border-border px-3 text-foreground transition-colors hover:border-foreground focus-visible:focus-ring"
            key={category.id}
            onClick={onSelect}
            params={{
              country: market.country,
              locale: market.locale,
              _splat: category.permalink,
            }}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/collections/$"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </SearchPanelSection>
  )
}
