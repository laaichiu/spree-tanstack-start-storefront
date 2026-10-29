import type {
  CatalogBreadcrumbDisplay,
  CatalogBreadcrumbLink,
  ProductDetailBrandLink,
  ProductDetailHeadingModel,
} from '@/components/contracts/catalog'
import { ProductRatingAnchorView } from './product-rating-anchor-view'
import { MoneyDisplayView } from '@/components/shared/money-display-view'

export type {
  CatalogBreadcrumbLink,
  ProductDetailBrandLink,
  ProductDetailHeadingModel,
} from '@/components/contracts/catalog'

type ProductDetailHeadingProps = {
  breadcrumbs: readonly CatalogBreadcrumbDisplay[]
  model: ProductDetailHeadingModel
  renderBrand?: ProductDetailBrandLink
  renderBreadcrumb: CatalogBreadcrumbLink
  showBreadcrumbs?: boolean
}

type ProductDetailBreadcrumbsProps = {
  breadcrumbLabel: string
  breadcrumbs: readonly CatalogBreadcrumbDisplay[]
  renderBreadcrumb: CatalogBreadcrumbLink
}

export function ProductDetailBreadcrumbsView({
  breadcrumbLabel,
  breadcrumbs,
  renderBreadcrumb,
}: ProductDetailBreadcrumbsProps) {
  return (
    <nav
      aria-label={breadcrumbLabel}
      className="text-xs leading-4 font-normal uppercase text-muted-foreground"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li
            className={index > 0 ? 'flex items-center gap-2' : undefined}
            key={breadcrumb.id}
          >
            {index > 0 && <span aria-hidden="true">/</span>}
            {renderBreadcrumb(breadcrumb, {
              children: breadcrumb.label,
              className:
                'transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            })}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function ProductDetailHeadingView({
  breadcrumbs,
  model,
  renderBrand,
  renderBreadcrumb,
  showBreadcrumbs = true,
}: ProductDetailHeadingProps) {
  return (
    <>
      {showBreadcrumbs && (
        <ProductDetailBreadcrumbsView
          breadcrumbLabel={model.breadcrumbLabel}
          breadcrumbs={breadcrumbs}
          renderBreadcrumb={renderBreadcrumb}
        />
      )}

      <section>
        {model.brand && renderBrand && (
          <div className="mb-3">
            {renderBrand(model.brand, {
              children: model.brand.name,
              className:
                'text-xs leading-4 font-normal tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            })}
          </div>
        )}
        <div className="grid min-w-0 grid-cols-4 items-baseline gap-2">
          <h1 className="col-span-3 min-w-0 text-sm leading-tight font-normal tracking-wider text-foreground uppercase wrap-anywhere md:text-base">
            {model.productName}
          </h1>
          <MoneyDisplayView
            {...model.price}
            className="min-w-0 justify-end text-right wrap-anywhere"
            variant="detail"
          />
        </div>

        {model.reviewAnchor && (
          <div className="mt-2">
            <ProductRatingAnchorView model={model.reviewAnchor} />
          </div>
        )}
      </section>
    </>
  )
}
