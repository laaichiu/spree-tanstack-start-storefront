import { SearchPanelSectionView } from './search-panel-section-view'

import type { SearchPopularSearchesModel } from '../contracts/search'

export type { SearchPopularSearchesModel } from '../contracts/search'

export function SearchPopularSearchesView({
  model,
  onSelect,
}: {
  model: SearchPopularSearchesModel
  onSelect: (query: string) => void
}) {
  return (
    <SearchPanelSectionView model={model}>
      <div className="space-y-3">
        {model.items.map((item) => (
          <button
            className="relative block w-fit max-w-full text-left text-sm leading-7 font-normal text-foreground after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none"
            key={item.id}
            onClick={() => onSelect(item.label)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </SearchPanelSectionView>
  )
}
