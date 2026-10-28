import type { SearchDrawerContentSlots } from '../contracts/search'

export type { SearchDrawerContentSlots } from '../contracts/search'

export function SearchDrawerContentView({
  mode,
  slots,
}: {
  mode: 'preview' | 'suggestions'
  slots: SearchDrawerContentSlots
}) {
  return mode === 'preview' ? slots.preview : slots.suggestions
}
