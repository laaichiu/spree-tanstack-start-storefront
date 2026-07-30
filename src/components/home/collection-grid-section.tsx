import { Link } from '@tanstack/react-router'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { useMarket } from '@/components/layout/market-provider'
import type { HomeFeaturedCategoriesModel } from '@/lib/catalog/model/home-page'

type CollectionGridSectionProps = {
  section: HomeFeaturedCategoriesModel
}

export function CollectionGridSection({ section }: CollectionGridSectionProps) {
  const { market, t } = useMarket()
  const { categories, status } = section

  return (
    <section className="bg-background">
      <div className="px-4 py-4">
        <h2 className="text-xl uppercase leading-tight text-start text-foreground">
          {t('home.featuredCategories')}
        </h2>
      </div>

      {status === 'error' ? (
        <div className="mx-4 mb-4 border border-dashed border-foreground/30 bg-muted p-8">
          <p className="text-sm leading-4 font-normal text-foreground uppercase">
            {t('home.featuredCategoriesLoadFailed')}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('home.featuredCategoriesLoadFailedDescription')}
          </p>
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="mx-4 mb-4 border border-dashed border-foreground/30 bg-muted p-8">
          <p className="text-sm leading-4 font-normal text-foreground uppercase">
            {t('home.noFeaturedCategories')}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t('home.noFeaturedCategoriesDescription')}
          </p>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              className="group block text-foreground focus-visible:focus-ring"
              key={category.id}
              params={{
                country: market.country,
                locale: market.locale,
                _splat: category.permalink,
              }}
              search={DEFAULT_PRODUCT_LISTING_SEARCH}
              to="/$country/$locale/collections/$"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {category.imageUrl ? (
                  <img
                    alt={category.name}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    decoding="async"
                    loading="lazy"
                    src={category.imageUrl}
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-6 py-7 text-center text-white">
                  <h3 className="text-2xl leading-none font-semibold tracking-wider uppercase">
                    {category.name}
                  </h3>
                  <span className="mt-3 inline-flex border-b border-white/80 pb-1 text-sm font-light tracking-wider uppercase">
                    {t('home.shopAll')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}
