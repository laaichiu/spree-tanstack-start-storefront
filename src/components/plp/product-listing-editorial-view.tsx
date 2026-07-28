import type { ProductListingControllerValue } from '@/components/plp/product-listing-controller'
import { ProductListingControls } from '@/components/plp/product-listing-controls'
import { ProductListingHeading } from '@/components/plp/product-listing-heading'
import { ProductListingPagination } from '@/components/plp/product-listing-pagination'
import { ProductListingResults } from '@/components/plp/product-listing-results'

export function ProductListingEditorialView({
  controller,
}: {
  controller: ProductListingControllerValue
}) {
  const { applySearch, page, pagination, totalCount } = controller

  return (
    <section className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
      <ProductListingHeading
        className="mx-auto max-w-4xl border-y border-border py-10 text-center [&_ol]:justify-center [&>div]:mx-auto [&>div>div]:mx-auto"
        page={page}
      />

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
        <aside className="border-t border-border lg:sticky lg:top-24">
          {page.status === 'ready' ? (
            <ProductListingControls
              filters={page.filters}
              onApply={applySearch}
              search={page.search}
              totalCount={totalCount}
            />
          ) : null}
        </aside>

        <div className="space-y-10">
          <ProductListingResults page={page} />
          <ProductListingPagination pagination={pagination} />
        </div>
      </div>
    </section>
  )
}
