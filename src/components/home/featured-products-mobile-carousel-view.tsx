import type { ReactNode } from 'react'

import type { CatalogProductReference } from '@/lib/catalog/contracts'
import { useFeaturedProductsMobileCarouselController } from './use-featured-products-mobile-carousel-controller'

type FeaturedProductsMobileCarouselViewProps<
  TProduct extends CatalogProductReference = CatalogProductReference,
> = {
  products: readonly TProduct[]
  renderCard: (product: TProduct) => ReactNode
}

export function FeaturedProductsMobileCarouselView<
  TProduct extends CatalogProductReference = CatalogProductReference,
>({ products, renderCard }: FeaturedProductsMobileCarouselViewProps<TProduct>) {
  const { indicatorRef, indicatorThumbRef, scrollerRef } =
    useFeaturedProductsMobileCarouselController(
      products.map((product) => product.id).join('\u0000'),
    )

  return (
    <div className="space-y-5 lg:hidden">
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
        ref={scrollerRef}
      >
        {products.map((product) => (
          <div
            className="min-w-64 max-w-64 shrink-0 snap-start sm:min-w-70 sm:max-w-70"
            key={product.id}
          >
            {renderCard(product)}
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <div className="flex justify-center">
          <div
            className="relative h-1 w-24 overflow-hidden rounded-full bg-muted opacity-0 transition-opacity duration-200 motion-reduce:transition-none"
            ref={indicatorRef}
          >
            <div
              className="absolute inset-y-0 rounded-full bg-foreground transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
              ref={indicatorThumbRef}
              style={{ left: '0%', width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
