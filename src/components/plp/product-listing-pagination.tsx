import { ArrowLeft, ArrowRight } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductListingPaginationController } from '@/components/plp/product-listing-controller'

export function ProductListingPagination({
  pagination,
}: {
  pagination: ProductListingPaginationController
}) {
  const { t } = useMarket()

  if (!pagination.rangeLabel) {
    return null
  }

  return (
    <footer className="space-y-6 pt-2 pb-8">
      <p className="text-center text-sm tracking-wider text-foreground uppercase">
        {pagination.rangeLabel}
      </p>
      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            aria-label={t('product.previousPage')}
            className="inline-flex h-10 w-10 items-center justify-center border border-input text-foreground transition-colors hover:border-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-35"
            disabled={!pagination.canGoPrevious}
            onClick={pagination.goToPrevious}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="min-w-16 text-center text-sm tracking-wider text-muted-foreground uppercase">
            {pagination.pageLabel}
          </span>
          <button
            aria-label={t('product.nextPage')}
            className="inline-flex h-10 w-10 items-center justify-center border border-input text-foreground transition-colors hover:border-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-35"
            disabled={!pagination.canGoNext}
            onClick={pagination.goToNext}
            type="button"
          >
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </footer>
  )
}
