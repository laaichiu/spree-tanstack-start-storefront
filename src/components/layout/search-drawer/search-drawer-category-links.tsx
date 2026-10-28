import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { useSearchSuggestionCategories } from '@/lib/catalog/client/use-search-suggestions'
import { SearchCategoryLinkView } from '@/components/layout/search-category-link-view'
import { SearchCategoryLinksView } from '@/components/layout/search-category-links-view'
import { SearchPanelSectionView } from '@/components/layout/search-panel-section-view'

export function SearchDrawerCategoryLinks({
  onSelect,
  open,
}: {
  onSelect: () => void
  open: boolean
}) {
  const { market, t } = useMarket()
  const query = useSearchSuggestionCategories({ enabled: open, market })
  const categories = query.data ?? []
  const model = { title: t('header.categories') }

  if (query.isPending) {
    return (
      <SearchPanelSectionView model={model}>
        <div aria-busy="true" className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              aria-hidden="true"
              className="h-8 w-24 animate-pulse bg-muted motion-reduce:animate-none"
              key={index}
            />
          ))}
        </div>
      </SearchPanelSectionView>
    )
  }

  if (query.isError) {
    return (
      <SearchPanelSectionView model={model}>
        <div className="space-y-3" role="status">
          <p className="text-xs leading-6 text-muted-foreground">
            {t('header.suggestedCategoriesUnavailable')}
          </p>
          <button
            className="text-xs leading-4 uppercase underline underline-offset-4 hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => void query.refetch()}
            type="button"
          >
            {t('footer.retryInteractive')}
          </button>
        </div>
      </SearchPanelSectionView>
    )
  }

  if (!categories.length) {
    return null
  }

  return (
    <SearchCategoryLinksView model={model}>
      {categories.map((category) => (
        <SearchCategoryLinkView
          key={category.id}
          renderLink={(content, className) => (
            <Link
              className={className}
              onClick={onSelect}
              params={{
                country: market.country,
                locale: market.locale,
                _splat: category.permalink,
              }}
              search={DEFAULT_PRODUCT_LISTING_SEARCH}
              to="/$country/$locale/collections/$"
            >
              {content}
            </Link>
          )}
        >
          {category.name}
        </SearchCategoryLinkView>
      ))}
    </SearchCategoryLinksView>
  )
}
