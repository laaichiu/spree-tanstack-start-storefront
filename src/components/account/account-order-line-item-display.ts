import type { OrderLineItem } from '@/lib/account/contracts'

type OrderLineItemFields = Pick<
  OrderLineItem,
  | 'displayPrice'
  | 'displayTotal'
  | 'id'
  | 'imageUrl'
  | 'name'
  | 'optionsText'
  | 'quantity'
  | 'slug'
>

export type OrderLineItemDisplay = Omit<OrderLineItemFields, 'imageUrl'> & {
  imageUrl?: string
}

export function getOrderLineItemDisplays(
  items: readonly OrderLineItem[],
): OrderLineItemDisplay[] {
  return items.map((item) => ({
    displayPrice: item.displayPrice,
    displayTotal: item.displayTotal,
    id: item.id,
    imageUrl: item.imageUrl ?? undefined,
    name: item.name,
    optionsText: item.optionsText,
    quantity: item.quantity,
    slug: item.slug,
  }))
}
