import { isColorOption } from '@/lib/catalog/contracts'
import type { CartLineItem } from '@/lib/cart/contracts'
import type { CartLineItemPresentation } from '@/components/contracts/cart/line-items'
import { getMoneyDisplay } from '@/components/shared/money-display'
import { getCartDisplayOptions } from './cart-display-options'

export function getCartLineItemPresentation(
  item: CartLineItem,
  locale: string,
): CartLineItemPresentation {
  return {
    displayOptions: getCartDisplayOptions(item).map(
      ({ colorCode, id, label, optionTypeLabel, optionTypeName }) => ({
        ...(colorCode ? { colorCode } : {}),
        id,
        isColor: isColorOption(optionTypeLabel || optionTypeName),
        label,
      }),
    ),
    id: item.id,
    imageUrl: item.imageUrl ?? undefined,
    name: item.name,
    productSlug: item.productSlug,
    quantity: item.quantity,
    totalPrice: getMoneyDisplay(
      item.totalPrice,
      item.compareAtTotalPrice,
      locale,
    ),
    unitPrice: getMoneyDisplay(item.unitPrice, null, locale, {
      unitPrice: true,
    }),
  }
}
