import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { ProductCard } from '@/components/plp/product-card'
import { useMarket } from '@/components/layout/market-provider'
import type { HomeFeaturedProductsModel } from '@/lib/catalog/model/home-page'

type FeaturedProductsSectionProps = {
  section: HomeFeaturedProductsModel
}

const DESKTOP_PRODUCTS_PER_PAGE = 6

function chunkProducts<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [items]
  }

  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export function FeaturedProductsSection({
  section,
}: FeaturedProductsSectionProps) {
  const { market, t } = useMarket()
  const { products, status } = section
  const mobileScrollerRef = useRef<HTMLDivElement | null>(null)
  const mobileIndicatorRef = useRef<HTMLDivElement | null>(null)
  const mobileIndicatorThumbRef = useRef<HTMLDivElement | null>(null)
  const [desktopPage, setDesktopPage] = useState(0)
  const displayProducts = products.slice(0, 12)
  const desktopPages = chunkProducts(displayProducts, DESKTOP_PRODUCTS_PER_PAGE)
  const safeDesktopPage = Math.min(
    desktopPage,
    Math.max(desktopPages.length - 1, 0),
  )
  const hasMultipleDesktopPages = desktopPages.length > 1

  const updateMobileIndicator = useCallback(() => {
    const element = mobileScrollerRef.current
    const indicator = mobileIndicatorRef.current
    const thumb = mobileIndicatorThumbRef.current

    if (!element || !indicator || !thumb) {
      return
    }

    const maxScroll = element.scrollWidth - element.clientWidth
    const hasOverflow = maxScroll > 4

    if (!hasOverflow) {
      indicator.style.opacity = '0'
      thumb.style.left = '0%'
      thumb.style.width = '100%'
      return
    }

    const progress = maxScroll <= 0 ? 0 : element.scrollLeft / maxScroll
    const thumbWidthPercent = Math.max(
      (element.clientWidth / element.scrollWidth) * 100,
      20,
    )

    indicator.style.opacity = '1'
    thumb.style.width = `${thumbWidthPercent}%`
    thumb.style.left = `${progress * (100 - thumbWidthPercent)}%`
  }, [])

  useEffect(() => {
    const element = mobileScrollerRef.current

    if (!element) {
      return
    }

    updateMobileIndicator()

    element.addEventListener('scroll', updateMobileIndicator, {
      passive: true,
    })
    window.addEventListener('resize', updateMobileIndicator)

    return () => {
      element.removeEventListener('scroll', updateMobileIndicator)
      window.removeEventListener('resize', updateMobileIndicator)
    }
  }, [displayProducts.length, updateMobileIndicator])

  function goToDesktopPage(nextPage: number) {
    if (
      nextPage < 0 ||
      nextPage >= desktopPages.length ||
      nextPage === safeDesktopPage
    ) {
      return
    }

    startTransition(() => {
      setDesktopPage(nextPage)
    })
  }

  return (
    <section className="bg-background">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <h2 className="text-xl uppercase leading-tight text-start text-foreground">
            {t('home.newIn')}
          </h2>
          <Link
            className="text-sm leading-4 font-normal uppercase inline-flex border-b border-foreground/70 pb-1 text-foreground transition hover:border-foreground hover:text-muted-foreground focus-visible:focus-ring"
            params={{
              country: market.country,
              locale: market.locale,
            }}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/products"
          >
            {t('home.viewAll')}
          </Link>
        </div>
      </div>

      {status === 'error' ? (
        <div className="mx-4 mb-4 border border-dashed border-foreground/30 bg-muted p-8">
          <p className="text-sm leading-4 font-normal uppercase text-foreground">
            {t('home.newProductsLoadFailed')}
          </p>
          <p className="text-sm leading-6 mt-3 text-muted-foreground">
            {t('home.newProductsLoadFailedDescription')}
          </p>
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="mx-4 mb-4 border border-dashed border-foreground/30 bg-muted p-8">
          <p className="text-sm leading-4 font-normal uppercase text-foreground">
            {t('home.noNewProducts')}
          </p>
          <p className="text-sm leading-6 mt-3 text-muted-foreground">
            {t('product.noProductsDescription')}
          </p>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div className="mb-4">
          <div className="relative hidden lg:block">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${safeDesktopPage * 100}%)`,
                }}
              >
                {desktopPages.map((page, pageIndex) => (
                  <div
                    className="grid min-w-full grid-cols-6 gap-4"
                    key={`new-in-page-${pageIndex + 1}`}
                  >
                    {page.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {safeDesktopPage > 0 ? (
              <button
                aria-label={t('product.carouselPrev')}
                className="absolute top-1/2 left-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center bg-background/70 text-foreground transition hover:bg-background focus-visible:focus-ring"
                onClick={() => goToDesktopPage(safeDesktopPage - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              </button>
            ) : null}

            {hasMultipleDesktopPages &&
            safeDesktopPage < desktopPages.length - 1 ? (
              <button
                aria-label={t('product.carouselNext')}
                className="absolute top-1/2 right-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center bg-background/70 text-foreground transition hover:bg-background focus-visible:focus-ring"
                onClick={() => goToDesktopPage(safeDesktopPage + 1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="space-y-5 lg:hidden">
            <div
              className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:hidden"
              ref={mobileScrollerRef}
            >
              {displayProducts.map((product) => (
                <div
                  className="min-w-64 max-w-64 shrink-0 snap-start sm:min-w-70 sm:max-w-70"
                  key={product.id}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {displayProducts.length > 1 ? (
              <div className="flex justify-center">
                <div
                  className="relative h-1 w-24 overflow-hidden rounded-full bg-muted opacity-0 transition-opacity duration-200"
                  ref={mobileIndicatorRef}
                >
                  <div
                    className="absolute inset-y-0 rounded-full bg-foreground transition-[left,width] duration-200 ease-out"
                    ref={mobileIndicatorThumbRef}
                    style={{ left: '0%', width: '100%' }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
