import type { ProductSummary } from '@/lib/catalog/model/product'
import { useMarket } from '@/components/layout/market-provider'

import { SearchFeaturedProductCard } from './search-drawer-product-card'
import type { SuggestedItemsIndicatorState } from './search-drawer.model'
import { useSearchSuggestionsCarousel } from './use-search-suggestions-carousel'
import { SearchPanelSection } from './search-panel-section'

type SearchSuggestedItemsProps = {
  failed: boolean
  loading: boolean
  onRetry: () => void
  onSelect: () => void
  open: boolean
  products: ProductSummary[]
}

export function SearchSuggestedItems({
  failed,
  loading,
  onRetry,
  onSelect,
  open,
  products,
}: SearchSuggestedItemsProps) {
  const { t } = useMarket()
  const carousel = useSearchSuggestionsCarousel({
    enabled: open && products.length > 0,
    isOpen: open,
  })

  return (
    <SearchPanelSection title={t('header.suggestedProducts')}>
      {loading ? (
        <SuggestedItemsSkeleton />
      ) : failed && products.length === 0 ? (
        <SuggestedItemsError onRetry={onRetry} />
      ) : products.length > 0 ? (
        <div className="space-y-4">
          <ul
            aria-label={t('header.suggestedProducts')}
            className="-mx-1 flex cursor-grab touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 select-none active:cursor-grabbing lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onClickCapture={carousel.onClickCapture}
            onDragStart={carousel.onDragStart}
            onMouseDownCapture={carousel.onMouseDownCapture}
            ref={carousel.scrollerRef}
          >
            {products.map((product) => (
              <li className="min-w-40 max-w-40 shrink-0" key={product.id}>
                <SearchFeaturedProductCard
                  onSelect={onSelect}
                  product={product}
                />
              </li>
            ))}
          </ul>

          <SearchSuggestedItemsPagination
            indicator={carousel.indicator}
            onSelectPage={carousel.scrollToPage}
          />
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground" role="status">
          {t('header.noSuggestedProducts')}
        </p>
      )}
    </SearchPanelSection>
  )
}

function SuggestedItemsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useMarket()

  return (
    <div className="space-y-3" role="status">
      <p className="text-sm leading-6 text-muted-foreground">
        {t('header.suggestedProductsUnavailable')}
      </p>
      <button
        className="text-sm leading-4 font-normal uppercase text-foreground underline underline-offset-4 transition-opacity hover:opacity-65 focus-visible:focus-ring"
        onClick={onRetry}
        type="button"
      >
        {t('footer.retryInteractive')}
      </button>
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
          <div className="aspect-product w-full animate-pulse bg-muted" />
          <div className="space-y-2 px-0.5 pt-3">
            <div className="h-3 w-4/5 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-2/5 animate-pulse rounded-sm bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchSuggestedItemsPagination({
  indicator,
  onSelectPage,
}: {
  indicator: SuggestedItemsIndicatorState
  onSelectPage: (pageIndex: number) => void
}) {
  const { t } = useMarket()

  if (!indicator.hasOverflow && indicator.pageCount <= 1) {
    return null
  }

  return (
    <>
      {indicator.hasOverflow ? (
        <div className="flex justify-center lg:hidden">
          <div className="relative h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 rounded-full bg-foreground transition-[left,width] duration-200 ease-out"
              style={{
                left: `${indicator.progress * (100 - indicator.thumbWidthPercent)}%`,
                width: `${indicator.thumbWidthPercent}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {indicator.pageCount > 1 ? (
        <div className="hidden items-center justify-center gap-2 lg:flex">
          {Array.from({ length: indicator.pageCount }).map((_, index) => {
            const isActive = index === indicator.activePage

            return (
              <button
                aria-label={`${t('header.suggestedProducts')} ${index + 1}`}
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
      ) : null}
    </>
  )
}
