import type { CatalogProductCardViewProps } from '../contracts/catalog'
import { ProductCardView } from './product-card-view'
import { ProductOfferBadgesView } from './product-offer-badges-view'
import { ProductVariantSwatchesView } from './product-variant-swatches-view'

export type {
  CatalogProductCardCapabilities,
  CatalogProductCardModel,
  CatalogProductCardViewProps,
} from '../contracts/catalog'

/**
 * Theme-owned catalog card presentation.
 *
 * Runtime prepares the display model, price presentation, and variant
 * capability.
 * This component owns only card structure, badges, swatches, and visual
 * interaction states.
 */
export function CatalogProductCardView({
  capabilities,
  model,
  onVariantChange,
  priority,
  variant = 'default',
}: CatalogProductCardViewProps) {
  return (
    <ProductCardView
      displayImage={model.displayImage}
      imageFallback={model.imageFallbackLabel}
      outOfStockLabel={model.outOfStockLabel}
      price={model.price}
      priority={priority}
      product={{ attribution: model.attribution, name: model.name }}
      capabilities={capabilities}
      variant={variant}
      slots={{
        badges: (
          <ProductOfferBadgesView
            preorderLabel={model.preorderLabel}
            saleLabel={model.saleLabel}
          />
        ),
        swatches: variant === 'listing' && model.colorVariants.length > 0 && (
          <ProductVariantSwatchesView
            activeVariantId={model.activeVariantId}
            colorVariants={model.colorVariants}
            onVariantChange={onVariantChange}
          />
        ),
      }}
    />
  )
}
