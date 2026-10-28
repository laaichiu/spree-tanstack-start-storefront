import { useMarket } from '@/components/layout/market-provider'
import type { SearchPopularSearch } from '@/lib/catalog/contracts'
import { popularSearchLabelKeys } from '@/config/search'
import { SearchPopularSearchesView } from '@/components/layout/search-popular-searches-view'

export function SearchPopularSearches({
  onNavigateToSearchResults,
}: {
  onNavigateToSearchResults: (query: string) => void
}) {
  const { t } = useMarket()
  const items: SearchPopularSearch[] = popularSearchLabelKeys.map(
    (labelKey) => ({ id: labelKey, label: t(labelKey) }),
  )

  return (
    <SearchPopularSearchesView
      model={{
        items,
        title: t('header.popularSearches'),
      }}
      onSelect={onNavigateToSearchResults}
    />
  )
}
