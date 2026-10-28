import type { ReactNode } from 'react'

import type {
  CatalogProductCardCapabilities,
  ProductCardImage,
  ProductCardSlots,
} from '../contracts/catalog'
import type { MoneyDisplay } from '@/components/shared/money-display'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import { MoneyDisplayView } from '@/components/shared/money-display-view'

export type { ProductCardImage, ProductCardSlots } from '../contracts/catalog'

export type ProductCardProduct = {
  attribution: string | null
  name: string
}

const PRODUCT_CARD_SIZES = {
  default: '(min-width: 1024px) 16.667vw, (min-width: 640px) 280px, 256px',
  listing: '(min-width: 1280px) 25vw, (min-width: 768px) 33.333vw, 50vw',
} as const

const PRODUCT_LINK_CLASS_NAME =
  'block text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type ProductCardViewProps = {
  capabilities: CatalogProductCardCapabilities
  displayImage: ProductCardImage | null
  imageFallback: string
  outOfStockLabel: string | null
  price: MoneyDisplay
  priority?: boolean
  product: ProductCardProduct
  slots: ProductCardSlots
  variant: 'default' | 'listing'
}

type ProductCardLayoutProps = {
  capabilities: CatalogProductCardCapabilities
  image: ReactNode
  outOfStockLabel: string | null
  price: MoneyDisplay
  product: ProductCardProduct
}

type ProductListingCardProps = ProductCardLayoutProps & {
  swatches?: ReactNode
}

export function ProductCardView({
  capabilities,
  displayImage,
  imageFallback,
  outOfStockLabel,
  price,
  priority = false,
  product,
  slots,
  variant,
}: ProductCardViewProps) {
  const image = (
    <div className="relative aspect-product w-full overflow-hidden bg-muted">
      {slots.badges ? (
        <div className="absolute top-2 left-2 z-10">{slots.badges}</div>
      ) : null}
      {displayImage ? (
        <img
          alt={displayImage.alt}
          className="h-full w-full object-cover object-center transition duration-500 motion-reduce:transition-none group-hover:scale-105"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          sizes={PRODUCT_CARD_SIZES[variant]}
          src={displayImage.src}
          srcSet={displayImage.srcSet}
        />
      ) : (
        <ProductImageFallbackView label={imageFallback} />
      )}
    </div>
  )
  const layoutProps = {
    capabilities,
    image,
    outOfStockLabel,
    price,
    product,
  }

  if (variant === 'listing') {
    return <ProductListingCard {...layoutProps} swatches={slots.swatches} />
  }

  return <ProductSummaryCard {...layoutProps} />
}

function ProductListingCard({
  capabilities,
  image,
  outOfStockLabel,
  price,
  product,
  swatches,
}: ProductListingCardProps) {
  return (
    <article className="group min-w-0">
      {capabilities.renderProductLink(image, PRODUCT_LINK_CLASS_NAME)}
      <div className="min-h-24 bg-background pt-3">
        {capabilities.renderProductLink(
          <div className="space-y-1 px-1">
            {product.attribution && (
              <p className="truncate text-xs leading-4 tracking-wider text-muted-foreground uppercase">
                {product.attribution}
              </p>
            )}
            <h3 className="line-clamp-2 text-xs leading-4 font-normal tracking-wider text-foreground uppercase">
              {product.name}
            </h3>
            <MoneyDisplayView {...price} variant="listing" />
            {outOfStockLabel && (
              <p className="truncate text-xs leading-4 tracking-wider text-muted-foreground uppercase">
                {outOfStockLabel}
              </p>
            )}
          </div>,
          PRODUCT_LINK_CLASS_NAME,
        )}
        {swatches}
      </div>
    </article>
  )
}

function ProductSummaryCard({
  capabilities,
  image,
  outOfStockLabel,
  price,
  product,
}: ProductCardLayoutProps) {
  return (
    <article className="group min-w-0">
      {capabilities.renderProductLink(
        <>
          {image}
          <div className="bg-background px-4 py-2">
            {product.attribution && (
              <p className="text-xs leading-4 tracking-wider text-muted-foreground uppercase">
                {product.attribution}
              </p>
            )}
            <h3 className="line-clamp-2 text-xs leading-4 font-normal tracking-wider text-foreground uppercase">
              {product.name}
            </h3>
            <div className="mt-2">
              <MoneyDisplayView {...price} variant="default" />
            </div>
            {outOfStockLabel && (
              <p className="mt-2 text-xs leading-4 font-normal text-muted-foreground uppercase">
                {outOfStockLabel}
              </p>
            )}
          </div>
        </>,
        PRODUCT_LINK_CLASS_NAME,
      )}
    </article>
  )
}
