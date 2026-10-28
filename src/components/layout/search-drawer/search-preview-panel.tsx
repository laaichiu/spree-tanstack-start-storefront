import type { ProductSummary } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { SearchPreviewPanelView } from '@/components/layout/search-preview-panel-view'
import { getSearchPreviewPresentation } from './search-preview-model'

import { SearchDrawerCategoryLinks } from './search-drawer-category-links'
import { SearchPreviewRow } from './search-drawer-product-card'

export function SearchPreviewPanel({
  activeSearchLabel,
  failed,
  loading,
  onNavigateToSearchResults,
  onSelect,
  open,
  results,
}: {
  activeSearchLabel: string
  failed: boolean
  loading: boolean
  onNavigateToSearchResults: (query: string) => void
  onSelect: () => void
  open: boolean
  results: ProductSummary[]
}) {
  const { market, t } = useMarket()
  const model = getSearchPreviewPresentation({
    activeSearchLabel,
    failed,
    labels: {
      loading: t('header.search'),
      noProductsFound: t('product.noProductsFound'),
      productPlural: t('product.productPlural'),
      productSingular: t('product.productSingular'),
      searchResults: t('header.viewSearchResults'),
      searchResultsFor: t('product.searchResultsFor'),
      tryAnotherSearch: t('product.tryAnotherSearch'),
    },
    loading,
    locale: market.locale,
    resultCount: results.length,
  })

  return (
    <SearchPreviewPanelView
      model={model}
      onNavigateToSearchResults={() =>
        onNavigateToSearchResults(activeSearchLabel)
      }
      slots={{
        categoryLinks: (
          <SearchDrawerCategoryLinks onSelect={onSelect} open={open} />
        ),
        productRows: results.length > 0 && (
          <>
            {results.map((product) => (
              <SearchPreviewRow
                key={product.id}
                onSelect={onSelect}
                product={product}
              />
            ))}
          </>
        ),
      }}
    />
  )
}
