import { Link } from '@tanstack/react-router'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { useMarket } from '@/components/layout/market-provider'

export function HeroSection() {
  const { market, t } = useMarket()

  return (
    <section className="bg-background">
      <div className="relative isolate h-svh overflow-hidden">
        <picture>
          <source
            sizes="100vw"
            srcSet="/hero-960.webp 960w, /hero-1600.webp 1600w, /hero-2400.webp 2400w"
            type="image/webp"
          />
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            src="/hero.jpg"
          />
        </picture>
        <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 pb-10 text-center sm:px-10 sm:pb-14 lg:pb-0">
          <div className="max-w-lg px-4 py-8 text-white sm:px-8 sm:py-10 lg:-translate-y-10">
            <p className="text-sm leading-4 font-normal uppercase text-white/90">
              {t('home.heroEyebrow')}
            </p>
            <h1 className="text-2xl uppercase leading-none font-normal mt-4 text-white">
              {t('home.heroTitle')}
            </h1>
            <p className="text-sm leading-6 mx-auto mt-4 max-w-md text-white/90">
              {t('home.heroDescription')}
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                className="text-sm leading-4 font-normal uppercase inline-flex border-b border-white/80 pb-1 text-white transition hover:border-white hover:text-white/80 focus-visible:focus-ring"
                params={{
                  country: market.country,
                  locale: market.locale,
                }}
                search={DEFAULT_PRODUCT_LISTING_SEARCH}
                to="/$country/$locale/products"
              >
                {t('home.heroCta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
