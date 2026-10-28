import { Children } from 'react'
import type { ReactNode } from 'react'

import type {
  SearchSuggestionsIndicatorState,
  SearchSuggestedItemsActions,
  SearchSuggestedItemsModel,
} from '../contracts/search'

export type {
  SearchSuggestedItemsActions,
  SearchSuggestedItemsModel,
} from '../contracts/search'

type SearchSuggestedItemsViewProps = {
  actions: SearchSuggestedItemsActions
  model: SearchSuggestedItemsModel
  productCards: ReactNode
}

export function SearchSuggestedItemsView({
  actions,
  model,
  productCards,
}: SearchSuggestedItemsViewProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {model.labels.section}
      </h2>
      <SearchSuggestedItemsContent
        actions={actions}
        model={model}
        productCards={productCards}
      />
    </section>
  )
}

function SearchSuggestedItemsContent({
  actions,
  model,
  productCards,
}: SearchSuggestedItemsViewProps) {
  if (model.status === 'loading') {
    return <SuggestedItemsSkeleton />
  }

  if (model.status === 'error') {
    return (
      <div className="space-y-3" role="status">
        <p className="text-xs leading-6 text-muted-foreground">
          {model.labels.unavailable}
        </p>
        <button
          className="text-xs leading-4 font-normal uppercase text-foreground underline underline-offset-4 transition-opacity hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={actions.retry}
          type="button"
        >
          {model.labels.retry}
        </button>
      </div>
    )
  }

  if (model.status === 'empty') {
    return (
      <p className="text-xs leading-6 text-muted-foreground" role="status">
        {model.labels.empty}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ul
        aria-label={model.labels.section}
        className="-mx-1 flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 select-none active:cursor-grabbing lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClickCapture={actions.captureClick}
        onDragStart={actions.dragStart}
        onMouseDownCapture={actions.mouseDownCapture}
        ref={actions.scrollerRef}
      >
        {Children.map(productCards, (productCard) => (
          <li className="min-w-40 max-w-40 shrink-0">{productCard}</li>
        ))}
      </ul>

      <SearchSuggestedItemsPagination
        indicator={model.indicator}
        labels={model.labels}
        onSelectPage={actions.selectPage}
      />
    </div>
  )
}

function SuggestedItemsSkeleton() {
  return (
    <div aria-busy="true" className="-mx-1 flex gap-3 overflow-hidden px-1">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          aria-hidden="true"
          className="min-w-40 max-w-40 shrink-0"
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
          key={`search-suggestion-skeleton-${index}`}
        >
          <div className="aspect-product w-full animate-pulse bg-muted motion-reduce:animate-none" />
          <div className="space-y-2 px-0.5 pt-3">
            <div className="h-3 w-4/5 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-2/5 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchSuggestedItemsPagination({
  indicator,
  labels,
  onSelectPage,
}: {
  indicator: SearchSuggestionsIndicatorState
  labels: { page: string }
  onSelectPage: (pageIndex: number) => void
}) {
  if (!indicator.hasOverflow && indicator.pageCount <= 1) {
    return null
  }

  return (
    <>
      {indicator.hasOverflow && (
        <div className="flex justify-center lg:hidden">
          <div className="relative h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 rounded-full bg-foreground transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
              style={{
                left: `${indicator.progress * (100 - indicator.thumbWidthPercent)}%`,
                width: `${indicator.thumbWidthPercent}%`,
              }}
            />
          </div>
        </div>
      )}

      {indicator.pageCount > 1 && (
        <div className="hidden items-center justify-center gap-2 lg:flex">
          {Array.from({ length: indicator.pageCount }).map((_, index) => {
            const isActive = index === indicator.activePage

            return (
              <button
                aria-label={`${labels.page} ${index + 1}`}
                aria-pressed={isActive}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-foreground'
                    : 'bg-muted hover:bg-muted-foreground'
                }`}
                // biome-ignore lint/suspicious/noArrayIndexKey: pagination dots represent static carousel pages.
                key={`suggested-items-page-${index + 1}`}
                onClick={() => onSelectPage(index)}
                type="button"
              />
            )
          })}
        </div>
      )}
    </>
  )
}
