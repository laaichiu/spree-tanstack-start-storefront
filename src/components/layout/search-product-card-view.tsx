import type { ReactNode } from 'react'

import type { ProductCardImage } from '../contracts/catalog'
import type { SearchProductCardModel } from '../contracts/search'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import { MoneyDisplayView } from '@/components/shared/money-display-view'

export type { SearchProductCardModel } from '../contracts/search'

type SearchProductCardProps = {
  imageFallback: string
  model: SearchProductCardModel
  renderProductLink: (options: {
    children: ReactNode
    className: string
    draggable?: boolean
  }) => ReactNode
}

function SearchProductImage({
  className,
  draggable,
  image,
  imageFallback,
  sizes,
}: {
  className: string
  draggable?: boolean
  image: ProductCardImage | null
  imageFallback: string
  sizes: string
}) {
  return (
    <div className={className}>
      {image ? (
        <img
          alt={image.alt}
          className="h-full w-full object-cover object-center transition duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
          draggable={draggable}
          loading="lazy"
          sizes={sizes}
          src={image.src}
          srcSet={image.srcSet}
        />
      ) : (
        <ProductImageFallbackView label={imageFallback} variant="compact" />
      )}
    </div>
  )
}

export function SearchPreviewRowView({
  imageFallback,
  model,
  renderProductLink,
}: SearchProductCardProps) {
  return renderProductLink({
    children: (
      <>
        <SearchProductImage
          className="relative aspect-product w-20 shrink-0 overflow-hidden bg-muted"
          image={model.image}
          imageFallback={imageFallback}
          sizes="5rem"
        />
        <div className="min-w-0 flex-1 space-y-2">
          {model.attribution && (
            <p className="text-xs leading-4 tracking-wider text-muted-foreground uppercase">
              {model.attribution}
            </p>
          )}
          <h3 className="line-clamp-2 text-xs leading-4 font-normal text-foreground uppercase">
            {model.name}
          </h3>
          <SearchProductPrice model={model} />
        </div>
      </>
    ),
    className:
      'group flex items-start gap-4 border-b border-border py-4 text-foreground transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 last:border-b-0',
  })
}

export function SearchFeaturedProductCardView({
  imageFallback,
  model,
  renderProductLink,
}: SearchProductCardProps) {
  return renderProductLink({
    children: (
      <>
        <SearchProductImage
          className="relative aspect-product w-full overflow-hidden bg-muted"
          draggable={false}
          image={model.image}
          imageFallback={imageFallback}
          sizes="10rem"
        />
        <div className="space-y-2 px-0.5 pt-3">
          {model.attribution && (
            <p className="text-xs leading-4 tracking-wider text-muted-foreground uppercase">
              {model.attribution}
            </p>
          )}
          <h3 className="line-clamp-2 text-xs leading-4 font-normal text-foreground uppercase">
            {model.name}
          </h3>
          <SearchProductPrice model={model} />
        </div>
      </>
    ),
    className:
      'group block max-w-[10rem] min-w-[10rem] shrink-0 snap-start text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:snap-none',
    draggable: false,
  })
}

function SearchProductPrice({ model }: { model: SearchProductCardModel }) {
  return (
    <MoneyDisplayView
      compareAtPriceLabel={model.compareAtPriceLabel}
      priceLabel={model.priceLabel}
      variant="listing"
    />
  )
}
