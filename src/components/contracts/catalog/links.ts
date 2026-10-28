import type { ReactNode } from 'react'

export type CatalogBreadcrumbDisplay = {
  id: string
  isCurrent?: boolean
  label: string
}

export type CatalogBreadcrumbLink = (
  breadcrumb: CatalogBreadcrumbDisplay,
  props: { children: ReactNode; className: string },
) => ReactNode
