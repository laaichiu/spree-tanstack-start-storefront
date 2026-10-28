import { ArrowLeft, ArrowRight } from 'lucide-react'

import type { ProductListingPaginationProps } from '../contracts/catalog'

export type {
  ProductListingPaginationActions,
  ProductListingPaginationModel,
  ProductListingPaginationProps,
} from '../contracts/catalog'

export function ProductListingPaginationView({
  actions,
  model,
}: ProductListingPaginationProps) {
  return (
    <footer className="space-y-6 pt-2 pb-8">
      <p className="text-center text-xs tracking-wider text-foreground uppercase">
        {model.rangeLabel}
      </p>
      {model.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            aria-label={model.previousPageLabel}
            className="inline-flex h-10 w-10 items-center justify-center border border-input text-foreground transition-colors motion-reduce:transition-none enabled:hover:not-focus-visible:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={!model.canGoPrevious}
            onClick={actions.previous}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="min-w-16 text-center text-xs tracking-wider text-muted-foreground uppercase">
            {model.pageLabel}
          </span>
          <button
            aria-label={model.nextPageLabel}
            className="inline-flex h-10 w-10 items-center justify-center border border-input text-foreground transition-colors motion-reduce:transition-none enabled:hover:not-focus-visible:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={!model.canGoNext}
            onClick={actions.next}
            type="button"
          >
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </footer>
  )
}
