import type { SearchSuggestedItemsStatus } from '@/components/contracts/search/suggestions'

export function getSearchSuggestedItemsStatus({
  failed,
  loading,
  resultCount,
}: {
  failed: boolean
  loading: boolean
  resultCount: number
}): SearchSuggestedItemsStatus {
  if (loading) {
    return 'loading'
  }

  if (resultCount > 0) {
    return 'ready'
  }

  return failed ? 'error' : 'empty'
}
