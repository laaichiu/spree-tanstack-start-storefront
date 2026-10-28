import { useEffect, useState } from 'react'

import { getProductColorVariants } from '@/lib/catalog/contracts'
import type {
  ProductColorVariant,
  ProductSummary,
} from '@/lib/catalog/contracts'
import type {
  CatalogProductCardCapabilities,
  CatalogProductCardViewProps,
  CatalogProductColorVariant,
} from '@/components/contracts/catalog'
import { CatalogProductCardView } from '@/components/catalog/catalog-product-card-view'
import {
  getInitialProductVariantId,
  getProductCardDisplay,
} from './product-card-display'
import { getMoneyDisplay } from '@/components/shared/money-display'

export type CatalogProductCardProps = Omit<
  CatalogProductCardViewProps,
  'capabilities' | 'model' | 'onVariantChange' | 'price'
> & {
  labels: {
    discount: (percent: number) => string
    imageFallback: string
    outOfStock: string
    preorder: string
  }
  locale: string
  product: ProductSummary
  priority?: boolean
  attribution?: string
  renderProductLink: CatalogProductCardCapabilities['renderProductLink']
}

export function CatalogProductCard({
  labels,
  locale,
  product,
  priority = false,
  attribution,
  renderProductLink,
  variant = 'default',
}: CatalogProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (selectedVariantId === null) {
      return
    }

    const selectedVariantIsAvailable = product.variants.some(
      (candidateVariant) => candidateVariant.id === selectedVariantId,
    )

    if (!selectedVariantIsAvailable) {
      setSelectedVariantId(null)
    }
  }, [product.variants, selectedVariantId])

  const initialVariantId = getInitialProductVariantId(product)
  const displayVariantId = selectedVariantId ?? initialVariantId
  const cardDisplay = getProductCardDisplay(product, displayVariantId)
  const activeVariantId = cardDisplay.variant?.id ?? null
  const cardAttribution = attribution ?? product.brand?.name ?? null

  return (
    <CatalogProductCardView
      model={{
        attribution: cardAttribution,
        activeVariantId,
        colorVariants: getProductColorVariantDisplays(
          getProductColorVariants(product.variants, activeVariantId),
        ),
        displayImage: cardDisplay.image,
        imageFallbackLabel: labels.imageFallback,
        name: product.name,
        outOfStockLabel:
          !cardDisplay.purchasable && !cardDisplay.preorder
            ? labels.outOfStock
            : null,
        price: getMoneyDisplay(
          cardDisplay.price,
          cardDisplay.compareAtPrice,
          locale,
          { unitPrice: true },
        ),
        preorderLabel: cardDisplay.preorder ? labels.preorder : null,
        saleLabel:
          cardDisplay.discountPercent === null
            ? null
            : labels.discount(cardDisplay.discountPercent),
      }}
      capabilities={{ renderProductLink }}
      onVariantChange={setSelectedVariantId}
      priority={priority}
      variant={variant}
    />
  )
}

function getProductColorVariantDisplays(
  variants: readonly ProductColorVariant[],
): CatalogProductColorVariant[] {
  return variants.map(({ optionValue, variant }) => ({
    optionValue: {
      colorCode: optionValue.colorCode,
      id: optionValue.id,
      imageUrl: optionValue.imageUrl,
      label: optionValue.label,
    },
    variant: { id: variant.id },
  }))
}
