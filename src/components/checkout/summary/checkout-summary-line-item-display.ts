import type { CartLineItem } from '@/lib/cart/contracts'
import { getMoneyDisplay } from '@/components/shared/money-display'
import { getCheckoutLineItemOptionsText } from '@/components/checkout/checkout-line-item-options-display'

export type CheckoutSummaryLineItemPresentation = {
  compareAtPrice: string | null
  id: string
  imageUrl: string | null
  name: string
  optionsText: string
  price: string
  productSlug: string
  quantity: number
}

export function getCheckoutSummaryLineItemPresentations({
  items,
  locale,
}: {
  items: readonly CartLineItem[]
  locale: string
}): CheckoutSummaryLineItemPresentation[] {
  return items.map((item) => {
    const priceDisplay = getMoneyDisplay(
      item.totalPrice,
      item.compareAtTotalPrice,
      locale,
    )

    return {
      compareAtPrice: priceDisplay.compareAtPriceLabel,
      id: item.id,
      imageUrl: item.imageUrl,
      name: item.name,
      optionsText: getCheckoutLineItemOptionsText(item.optionsText),
      price: priceDisplay.priceLabel,
      productSlug: item.productSlug,
      quantity: item.quantity,
    }
  })
}
