import { cn } from '@/components/ui/utils'

import type {
  CatalogBreadcrumbLink,
  ProductListingHeadingModel,
} from '../contracts/catalog'

export type { ProductListingHeadingModel } from '../contracts/catalog'

type ProductListingHeadingViewProps = {
  className?: string
  model: ProductListingHeadingModel
  renderBreadcrumb: CatalogBreadcrumbLink
}

export function ProductListingHeadingView({
  className,
  model,
  renderBreadcrumb,
}: ProductListingHeadingViewProps) {
  const hasCategoryImage = Boolean(model.categoryImageUrl)

  if (model.isCategoryPage) {
    return (
      <header
        className={cn(
          'relative isolate -mx-4 min-h-72 overflow-hidden border-b border-border bg-muted sm:min-h-80 lg:-mx-8 lg:min-h-88',
          className,
        )}
      >
        {model.categoryImageUrl && (
          <>
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              loading="eager"
              src={model.categoryImageUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/35 to-foreground/10" />
          </>
        )}

        <div
          className={cn(
            'relative flex min-h-72 w-full flex-col justify-end px-4 py-8 sm:min-h-80 lg:min-h-88 lg:px-8 lg:py-10',
            hasCategoryImage ? 'text-background' : 'text-foreground',
          )}
        >
          {model.breadcrumbs.length > 0 && (
            <ProductListingBreadcrumbsView
              breadcrumbs={model.breadcrumbs}
              className={cn(
                'mb-5 text-xs leading-4 font-normal uppercase',
                hasCategoryImage
                  ? 'text-background/90'
                  : 'text-muted-foreground',
              )}
              currentClassName="truncate"
              linkClassName={cn(
                'truncate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                hasCategoryImage
                  ? 'hover:text-background'
                  : 'hover:text-foreground',
              )}
              label={model.breadcrumbLabel}
              renderBreadcrumb={renderBreadcrumb}
            />
          )}

          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl leading-tight md:text-3xl break-words text-balance font-normal">
              {model.title}
            </h1>
            {model.description && (
              <div
                className={cn(
                  'max-w-2xl text-xs leading-6',
                  hasCategoryImage
                    ? 'text-background/90'
                    : 'text-muted-foreground',
                )}
              >
                {model.description}
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={cn('space-y-7', className)}>
      {model.breadcrumbs.length > 0 && (
        <ProductListingBreadcrumbsView
          breadcrumbs={model.breadcrumbs}
          className="mb-6 text-xs leading-4 font-normal uppercase text-muted-foreground"
          linkClassName="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          label={model.breadcrumbLabel}
          renderBreadcrumb={renderBreadcrumb}
        />
      )}

      <div className="max-w-3xl space-y-3">
        <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal text-foreground">
          {model.title}
        </h1>
        {model.description && (
          <div className="max-w-2xl text-xs leading-6 text-muted-foreground">
            {model.description}
          </div>
        )}
      </div>
    </header>
  )
}

function ProductListingBreadcrumbsView({
  breadcrumbs,
  className,
  currentClassName,
  label,
  linkClassName,
  renderBreadcrumb,
}: {
  breadcrumbs: ProductListingHeadingModel['breadcrumbs']
  className: string
  currentClassName?: string
  label: string
  linkClassName: string
  renderBreadcrumb: CatalogBreadcrumbLink
}) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li
            className={index > 0 ? 'flex items-center gap-2' : undefined}
            key={breadcrumb.id}
          >
            {index > 0 && <span aria-hidden="true">/</span>}
            {breadcrumb.isCurrent ? (
              <span className={currentClassName}>{breadcrumb.label}</span>
            ) : (
              renderBreadcrumb(breadcrumb, {
                children: breadcrumb.label,
                className: linkClassName,
              })
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
