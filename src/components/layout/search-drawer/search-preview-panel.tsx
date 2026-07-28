import { ArrowRight } from 'lucide-react'

import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { useMarket } from '@/components/layout/market-provider'
import { formatNumber } from '@/lib/i18n/messages'

import { SearchDrawerCategoryLinks } from './search-drawer-category-links'
import { SearchPreviewRow } from './search-drawer-product-card'

export function SearchPreviewPanel({
  activeSearchLabel,
  categories,
  failed,
  loading,
  onNavigateToSearchResults,
  onSelect,
  results,
}: {
  activeSearchLabel: string
  categories: CategoryNavigationItem[]
  failed: boolean
  loading: boolean
  onNavigateToSearchResults: (query: string) => void
  onSelect: () => void
  results: ProductSummary[]
}) {
  const { market, t } = useMarket()

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl leading-tight font-normal text-foreground">
          {t('product.searchResultsFor')} "{activeSearchLabel}"
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {loading
            ? t('header.search')
            : `${formatNumber(results.length, market.locale)} ${
                results.length === 1
                  ? t('product.productSingular')
                  : t('product.productPlural')
              }`}
        </p>
      </div>

      {loading ? (
        <SearchPreviewSkeleton />
      ) : results.length > 0 ? (
        <div className="space-y-5">
          <div>
            {results.map((product) => (
              <SearchPreviewRow
                key={product.id}
                onSelect={onSelect}
                product={product}
              />
            ))}
          </div>
          <SearchResultsButton
            label={t('header.viewSearchResults')}
            onClick={() => onNavigateToSearchResults(activeSearchLabel)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {failed
              ? t('product.tryAnotherSearch')
              : `${t('product.noProductsFound')}. ${t('product.tryAnotherSearch')}`}
          </p>
          <SearchResultsButton
            label={t('header.viewSearchResults')}
            onClick={() => onNavigateToSearchResults(activeSearchLabel)}
          />
        </div>
      )}

      <SearchDrawerCategoryLinks categories={categories} onSelect={onSelect} />
    </div>
  )
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
          <div className="aspect-product w-20 animate-pulse bg-muted" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-4/5 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded-sm bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded-sm bg-muted" />
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
      className="inline-flex items-center gap-2 text-sm font-normal text-foreground transition-opacity hover:opacity-65 focus-visible:focus-ring"
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}
