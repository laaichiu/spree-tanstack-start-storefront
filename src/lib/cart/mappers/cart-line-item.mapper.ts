import type { LineItem as SpreeLineItem } from '@spree/sdk'

import type {
  CartLineItem,
  CartLineItemOptionValue,
} from '@/lib/cart/contracts'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'

function mapLineItemOptionValues(
  item: SpreeLineItem,
): CartLineItemOptionValue[] {
  return item.option_values.map((optionValue) => ({
    id: optionValue.id,
    label: optionValue.label,
    name: optionValue.name,
    optionTypeId: optionValue.option_type_id,
    optionTypeLabel: optionValue.option_type_label,
    optionTypeName: optionValue.option_type_name,
    position: optionValue.position,
    colorCode: optionValue.color_code,
  }))
}

export function mapSpreeLineItemToCartLineItem(
  item: SpreeLineItem,
): CartLineItem {
  const compareAtTotalPrice = mapSpreeAmountToMoney(
    item.compare_at_amount,
    item.currency,
  )

  return {
    id: item.id,
    variantId: item.variant_id,
    productSlug: item.slug,
    name: item.name,
    optionsText: item.options_text,
    optionValues: mapLineItemOptionValues(item),
    quantity: item.quantity,
    imageUrl: item.thumbnail_url,
    unitPrice: mapSpreeAmountToMoney(item.price, item.currency),
    ...(compareAtTotalPrice ? { compareAtTotalPrice } : {}),
    totalPrice: mapSpreeAmountToMoney(item.total, item.currency),
  }
}
