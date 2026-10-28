import type { ReactNode } from 'react'
import type { SearchPanelSectionModel } from '../contracts/search'

export function SearchPanelSectionView({
  children,
  model,
}: {
  children: ReactNode
  model: SearchPanelSectionModel
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {model.title}
      </h2>
      {children}
    </section>
  )
}
