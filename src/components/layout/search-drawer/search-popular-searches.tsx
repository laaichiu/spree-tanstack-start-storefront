import { useMarket } from '@/components/layout/market-provider'

import {
  POPULAR_SEARCH_LIMIT,
  searchDrawerTextLinkClass,
} from './search-drawer.model'
import { SearchPanelSection } from './search-panel-section'

const POPULAR_SEARCH_KEYS = [
  'header.popularSearchCoffee',
  'header.popularSearchAirFryer',
  'header.popularSearchBlender',
  'header.popularSearchVacuum',
  'header.popularSearchHairDryer',
] as const

export function SearchPopularSearches({
  onNavigateToSearchResults,
}: {
  onNavigateToSearchResults: (query: string) => void
}) {
  const { t } = useMarket()

  return (
    <SearchPanelSection title={t('header.popularSearches')}>
      <div className="space-y-3">
        {POPULAR_SEARCH_KEYS.slice(0, POPULAR_SEARCH_LIMIT).map((searchKey) => {
          const searchTerm = t(searchKey)

          return (
            <button
              className={`${searchDrawerTextLinkClass} text-lg leading-7 font-normal text-foreground`}
              key={searchKey}
              onClick={() => onNavigateToSearchResults(searchTerm)}
              type="button"
            >
              {searchTerm}
            </button>
          )
        })}
      </div>
    </SearchPanelSection>
  )
}
