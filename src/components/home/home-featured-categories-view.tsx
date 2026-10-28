import type { ReactNode } from 'react'

import type {
  CatalogCategoryReference,
  HomeSectionStatus,
} from '@/lib/catalog/contracts'
import { CollectionCardView } from './collection-card-view'
import { CollectionGridSectionView } from './collection-grid-section-view'
import { HomeSectionMessageView } from './home-section-message-view'

export type HomeFeaturedCategoriesLabels = {
  emptyDescription: string
  emptyTitle: string
  errorDescription: string
  errorTitle: string
  shopAll: string
  title: string
}

type HomeFeaturedCategoriesViewProps = {
  categories: readonly CatalogCategoryReference[]
  labels: HomeFeaturedCategoriesLabels
  renderCategoryLink: (
    category: CatalogCategoryReference,
    content: ReactNode,
    className?: string,
  ) => ReactNode
  status: HomeSectionStatus
}

export function HomeFeaturedCategoriesView({
  categories,
  labels,
  renderCategoryLink,
  status,
}: HomeFeaturedCategoriesViewProps) {
  let content: ReactNode

  if (status === 'ready') {
    content = categories.map((category) => (
      <CollectionCardView
        imageUrl={category.imageUrl}
        key={category.id}
        name={category.name}
        renderLink={(linkContent, className) =>
          renderCategoryLink(category, linkContent, className)
        }
        shopAllLabel={labels.shopAll}
      />
    ))
  } else if (status === 'empty') {
    content = (
      <HomeSectionMessageView
        description={labels.emptyDescription}
        title={labels.emptyTitle}
      />
    )
  } else {
    content = (
      <HomeSectionMessageView
        description={labels.errorDescription}
        title={labels.errorTitle}
      />
    )
  }

  return <CollectionGridSectionView content={content} title={labels.title} />
}
