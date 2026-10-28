import type {
  ProductImage,
  ProductSummary,
  ProductVariant,
} from '@/lib/catalog/contracts'
import { isCatalogItemPurchasable } from '@/lib/catalog/contracts'
import { getDiscountPercent } from '@/lib/core/money'
import type { Money } from '@/lib/core/money'

export type ProductCardDisplay = {
  compareAtPrice: Money | null
  discountPercent: number | null
  image: ProductImage | null
  preorder: boolean
  price: Money | null
  purchasable: boolean
  variant: ProductVariant | null
}

export function getInitialProductVariantId(
  product: Pick<ProductSummary, 'defaultVariantId' | 'variants'>,
): string | null {
  const defaultVariant = product.variants.find(
    (variant) => variant.id === product.defaultVariantId,
  )

  return defaultVariant?.id ?? product.variants.at(0)?.id ?? null
}

export function getProductCardDisplay(
  product: ProductSummary,
  variantId: string | null,
): ProductCardDisplay {
  const usesProductOffer = variantId === null
  const variant = usesProductOffer
    ? null
    : (product.variants.find((candidate) => candidate.id === variantId) ?? null)
  const compareAtPrice = usesProductOffer
    ? (product.compareAtPrice ?? null)
    : (variant?.compareAtPrice ?? null)
  const price = usesProductOffer ? product.price : (variant?.price ?? null)
  const selectedOfferIsPurchasable = usesProductOffer
    ? isCatalogItemPurchasable(product)
    : variant !== null && isCatalogItemPurchasable(variant)
  const purchasable = price !== null && selectedOfferIsPurchasable

  return {
    compareAtPrice,
    discountPercent: getDiscountPercent(price, compareAtPrice),
    image: variant?.image ?? product.image,
    preorder: usesProductOffer
      ? product.preorder
      : (variant?.preorder ?? false),
    price,
    purchasable,
    variant,
  }
}
