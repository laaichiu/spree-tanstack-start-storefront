import type { OrderLineItem } from '@/lib/account/contracts'

export type OrderReviewItem = {
  id: string
  imageUrl?: string
  name: string
  optionsText: string
  productId: string
  variantId: string
}

/**
 * Selects order items that can be rendered as review targets by this theme.
 *
 * Review eligibility and submission remain runtime responsibilities; this
 * projection only keeps the identifiers and display fields needed by the
 * review surface.
 */
export function getOrderReviewItems(
  items: readonly OrderLineItem[],
): OrderReviewItem[] {
  return items.flatMap((item) => {
    const productId = item.slug.trim()
    const variantId = item.variantId.trim()

    if (!productId || !variantId) {
      return []
    }

    return [
      {
        id: item.id,
        imageUrl: item.imageUrl ?? undefined,
        name: item.name,
        optionsText: item.optionsText,
        productId,
        variantId,
      },
    ]
  })
}
