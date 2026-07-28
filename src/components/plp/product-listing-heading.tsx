import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type { ProductListingPageModel } from '@/lib/catalog/model/product-listing-page'
import { cn } from '@/lib/utils'

export function ProductListingHeading({
  className,
  page,
}: {
  className?: string
  page: ProductListingPageModel
}) {
  const { market, t } = useMarket()
  const breadcrumbs = page.category?.breadcrumbs ?? []
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <header className={cn('space-y-7', className)}>
      {breadcrumbs.length > 0 ? (
        <nav aria-label={t('product.breadcrumbs')} className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm tracking-wider text-muted-foreground uppercase">
            <li>
              <Link
                className="transition-colors hover:text-foreground focus-visible:focus-ring"
                params={marketParams}
                to="/$country/$locale"
              >
                {t('product.breadcrumbHome')}
              </Link>
            </li>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <li className="flex items-center gap-2" key={item.id}>
                  <span className="text-border">/</span>
                  {!isLast ? (
                    <Link
                      className="transition-colors hover:text-foreground focus-visible:focus-ring"
                      params={{
                        ...marketParams,
                        _splat: item.permalink,
                      }}
                      search={DEFAULT_PRODUCT_LISTING_SEARCH}
                      to="/$country/$locale/collections/$"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="font-normal text-foreground">
                      {item.name}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}

      <div className="max-w-3xl space-y-3">
        <h1 className="text-xl leading-none font-normal text-foreground">
          {page.title}
        </h1>
        {page.description ? (
          <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {page.description}
          </div>
        ) : null}
      </div>
    </header>
  )
}
