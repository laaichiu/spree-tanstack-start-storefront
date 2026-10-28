import type { CartLineItem } from '@/lib/cart/contracts'
import { formatMoney } from '@/components/shared/money-display'
import { getCheckoutLineItemOptionsText } from '@/components/checkout/checkout-line-item-options-display'

export type OrderPlacedLineItemDisplay = {
  id: string
  imageUrl: string | null
  name: string
  optionsText: string
  productSlug: string
  quantityText: string
  total: string
}

export function getOrderPlacedLineItemDisplays({
  items,
  locale,
  quantityLabel,
}: {
  items: readonly CartLineItem[]
  locale: string
  quantityLabel: string
}): OrderPlacedLineItemDisplay[] {
  return items.map((item) => ({
    id: item.id,
    imageUrl: item.imageUrl,
    name: item.name,
    optionsText: getCheckoutLineItemOptionsText(item.optionsText),
    productSlug: item.productSlug,
    quantityText: `${quantityLabel} ${item.quantity}`,
    total: formatMoney(item.totalPrice, locale),
  }))
}
