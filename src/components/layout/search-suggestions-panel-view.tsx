import type { SearchSuggestionsPanelSlots } from '../contracts/search'

export type { SearchSuggestionsPanelSlots } from '../contracts/search'

export function SearchSuggestionsPanelView({
  slots,
}: {
  slots: SearchSuggestionsPanelSlots
}) {
  return (
    <div className="space-y-9">
      {slots.popularSearches}
      {slots.suggestedItems}
      {slots.categoryLinks}
    </div>
  )
}
