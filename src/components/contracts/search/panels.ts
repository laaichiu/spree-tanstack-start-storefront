import type { ReactNode } from 'react'

import type { SearchPopularSearch } from '@/lib/catalog/contracts'

export type SearchPanelSectionModel = {
  title: string
}

export type SearchPopularSearchesModel = SearchPanelSectionModel & {
  items: readonly SearchPopularSearch[]
}

export type SearchPreviewPanelSlots = {
  categoryLinks: ReactNode
  productRows: ReactNode
}

export type SearchSuggestionsPanelSlots = {
  categoryLinks: ReactNode
  popularSearches: ReactNode
  suggestedItems: ReactNode
}

export type SearchDrawerContentSlots = {
  preview: ReactNode
  suggestions: ReactNode
}

export type SearchDrawerShellSlots = {
  content: ReactNode
  form: ReactNode
}
