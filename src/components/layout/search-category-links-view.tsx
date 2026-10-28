import type { ReactNode } from 'react'

import type { SearchPanelSectionModel } from '../contracts/search'
import { SearchPanelSectionView } from './search-panel-section-view'

export type { SearchPanelSectionModel } from '../contracts/search'

export function SearchCategoryLinksView({
  children,
  model,
}: {
  children: ReactNode
  model: SearchPanelSectionModel
}) {
  return (
    <SearchPanelSectionView model={model}>
      <div className="flex flex-wrap gap-2">{children}</div>
    </SearchPanelSectionView>
  )
}
