import type { MessageKey } from '@/lib/i18n/messages'

export const SEARCH_CATEGORY_LINK_LIMIT = 8
export const SEARCH_SUGGESTION_POSITION_FIELD = 'merchandising.search_position'
// Keep the literal Store API filter name so the SDK can validate the query key.
export const SEARCH_SUGGESTION_POSITION_FILTER =
  'cf_merchandising_search_position'

export const popularSearchLabelKeys = [
  'header.popularSearchCoffee',
  'header.popularSearchAirFryer',
  'header.popularSearchBlender',
  'header.popularSearchVacuum',
  'header.popularSearchHairDryer',
] as const satisfies readonly MessageKey[]
