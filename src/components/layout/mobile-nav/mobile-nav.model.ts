import type { CategoryNavigationItem } from '@/lib/catalog/model/category'

export const PANEL_TRANSITION_MS = 320

export const mainLinkClass =
  'text-lg uppercase leading-tight grid min-h-13 w-full grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-4 py-1 text-left text-foreground transition-opacity hover:opacity-65 focus-visible:focus-ring'

export const secondaryLinkClass =
  'text-sm leading-4 font-normal uppercase flex min-h-11 items-center justify-between py-1 text-left text-foreground transition-opacity hover:opacity-65 focus-visible:focus-ring'

export const chevronSlotClass =
  'flex h-6 w-6 items-center justify-end justify-self-end text-foreground'

export type MenuPanel =
  | { kind: 'main' }
  | { category: CategoryNavigationItem; kind: 'category' }
