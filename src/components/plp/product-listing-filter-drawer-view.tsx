import type { ReactNode } from 'react'

import {
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ProductListingFilterDrawerActions } from '../contracts/catalog'

export type { ProductListingFilterDrawerActions } from '../contracts/catalog'

export function ProductListingFilterDrawerView({
  actions,
  canClear,
  clearAllLabel,
  closeLabel,
  sections,
  showResultsLabel,
  title,
}: {
  actions: ProductListingFilterDrawerActions
  canClear: boolean
  clearAllLabel: string
  closeLabel: string
  sections: ReactNode
  showResultsLabel: string
  title: string
}) {
  return (
    <SheetContent className="shadow-none" disableSwipe side="left">
      <SheetHeader className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
        <SheetTitle>{title}</SheetTitle>
        <SheetCloseButton aria-label={closeLabel} />
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5">{sections}</div>

      <footer className="grid grid-cols-1 gap-2 border-t border-border p-4 sm:grid-cols-2">
        <button
          className="h-12 border border-input px-4 text-xs font-normal tracking-wider text-foreground uppercase transition-colors motion-reduce:transition-none enabled:hover:not-focus-visible:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canClear}
          onClick={actions.clear}
          type="button"
        >
          {clearAllLabel}
        </button>
        <button
          className="h-12 bg-primary px-4 text-xs font-normal tracking-wider text-primary-foreground uppercase transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={actions.apply}
          type="button"
        >
          {showResultsLabel}
        </button>
      </footer>
    </SheetContent>
  )
}
