export type CatalogBreadcrumbLink = {
  name: string
  url: string
}

export type CatalogBreadcrumbStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: CatalogBreadcrumbStructuredDataItem[]
}

export type CatalogBreadcrumbStructuredDataItem = {
  '@type': 'ListItem'
  item: string
  name: string
  position: number
}

export function getCatalogBreadcrumbStructuredData({
  breadcrumbs,
  currentItem,
  home,
}: {
  breadcrumbs: readonly CatalogBreadcrumbLink[]
  currentItem?: CatalogBreadcrumbLink | null
  home?: CatalogBreadcrumbLink | null
}): CatalogBreadcrumbStructuredData {
  const links = [
    ...(home ? [home] : []),
    ...breadcrumbs,
    ...(currentItem ? [currentItem] : []),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: links.map((link, index) => ({
      '@type': 'ListItem',
      item: link.url,
      name: link.name,
      position: index + 1,
    })),
  }
}
