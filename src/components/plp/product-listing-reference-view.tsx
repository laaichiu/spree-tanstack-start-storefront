import type { ProductListingControllerValue } from '@/components/plp/product-listing-controller'
import { ProductListingControls } from '@/components/plp/product-listing-controls'
import { ProductListingHeading } from '@/components/plp/product-listing-heading'
import { ProductListingPagination } from '@/components/plp/product-listing-pagination'
import { ProductListingResults } from '@/components/plp/product-listing-results'
import { cn } from '@/lib/utils'

export function ProductListingReferenceView({
  controller,
}: {
  controller: ProductListingControllerValue
}) {
  const { applySearch, page, pagination, totalCount } = controller

  return (
    <section
      className={cn(
        'w-full px-4 pb-6 lg:px-8',
        page.status === 'ready' ? 'pt-2 md:pt-6' : 'pt-6',
      )}
    >
      <ProductListingHeading page={page} />

      {page.status === 'ready' ? (
        <ProductListingControls
          filters={page.filters}
          onApply={applySearch}
          search={page.search}
          totalCount={totalCount}
        />
      ) : null}

      <div className="mt-8 space-y-8">
        <ProductListingResults page={page} />
        <ProductListingPagination pagination={pagination} />
      </div>
    </section>
  )
}
