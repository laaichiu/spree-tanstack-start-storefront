import { ArrowRight } from 'lucide-react'

import type { SearchPreviewPresentation } from './search-drawer/search-preview-model'
import type { SearchPreviewPanelSlots } from '../contracts/search'

export type { SearchPreviewPanelSlots } from '../contracts/search'

export function SearchPreviewPanelView({
  model,
  onNavigateToSearchResults,
  slots,
}: {
  model: SearchPreviewPresentation
  onNavigateToSearchResults: () => void
  slots: SearchPreviewPanelSlots
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-normal text-foreground">
          {model.activeSearchHeading}
        </h2>
        <p className="text-xs leading-6 text-muted-foreground">
          {model.status === 'loading'
            ? model.loadingLabel
            : model.productCountLabel}
        </p>
      </div>

      <SearchPreviewState
        model={model}
        onNavigateToSearchResults={onNavigateToSearchResults}
        productRows={slots.productRows}
      />

      {slots.categoryLinks}
    </div>
  )
}

function SearchPreviewState({
  model,
  onNavigateToSearchResults,
  productRows,
}: {
  model: SearchPreviewPresentation
  onNavigateToSearchResults: () => void
  productRows: SearchPreviewPanelSlots['productRows']
}) {
  switch (model.status) {
    case 'loading':
      return <SearchPreviewSkeleton />
    case 'ready':
      return (
        <div className="space-y-5">
          <div>{productRows}</div>
          <SearchResultsButton
            label={model.searchResultsLabel}
            onClick={onNavigateToSearchResults}
          />
        </div>
      )
    case 'empty':
      return (
        <div className="space-y-4">
          <p className="text-xs leading-6 text-muted-foreground">
            {model.emptyMessage}
          </p>
          <SearchResultsButton
            label={model.searchResultsLabel}
            onClick={onNavigateToSearchResults}
          />
        </div>
      )
  }
}

function SearchPreviewSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="flex gap-4 border-b border-border py-4 last:border-b-0"
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
          key={`search-preview-skeleton-${index}`}
        >
          <div className="aspect-product w-20 animate-pulse bg-muted motion-reduce:animate-none" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-4/5 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-3/5 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
            <div className="h-4 w-16 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchResultsButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="inline-flex items-center gap-2 text-xs font-normal text-foreground transition-opacity hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
