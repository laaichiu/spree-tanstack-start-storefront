export const SEARCH_PREVIEW_MIN_QUERY_LENGTH = 2

export type SearchDrawerMode = 'preview' | 'suggestions'

export function getSearchDrawerMode(query: string): SearchDrawerMode {
  return query.trim().length >= SEARCH_PREVIEW_MIN_QUERY_LENGTH
    ? 'preview'
    : 'suggestions'
}
