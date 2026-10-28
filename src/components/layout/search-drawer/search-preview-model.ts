import { getCatalogCountLabel } from '@/components/catalog/catalog-count-label'

export type SearchPreviewPresentationLabels = {
  loading: string
  noProductsFound: string
  productPlural: string
  productSingular: string
  searchResults: string
  searchResultsFor: string
  tryAnotherSearch: string
}

export type SearchPreviewPresentation = {
  activeSearchHeading: string
  emptyMessage: string
  loadingLabel: string
  productCountLabel: string
  searchResultsLabel: string
  status: 'empty' | 'loading' | 'ready'
}

function getSearchPreviewStatus(loading: boolean, resultCount: number) {
  if (loading) {
    return 'loading'
  }

  if (resultCount > 0) {
    return 'ready'
  }

  return 'empty'
}

export function getSearchPreviewPresentation({
  activeSearchLabel,
  failed,
  labels,
  loading,
  locale,
  resultCount,
}: {
  activeSearchLabel: string
  failed: boolean
  labels: SearchPreviewPresentationLabels
  loading: boolean
  locale: string
  resultCount: number
}): SearchPreviewPresentation {
  return {
    activeSearchHeading: `${labels.searchResultsFor} "${activeSearchLabel}"`,
    emptyMessage: failed
      ? labels.tryAnotherSearch
      : `${labels.noProductsFound}. ${labels.tryAnotherSearch}`,
    loadingLabel: labels.loading,
    productCountLabel: getCatalogCountLabel(resultCount, locale, {
      plural: labels.productPlural,
      singular: labels.productSingular,
    }),
    searchResultsLabel: labels.searchResults,
    status: getSearchPreviewStatus(loading, resultCount),
  }
}
