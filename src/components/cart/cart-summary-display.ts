import type { CartSummaryAmounts } from '@/lib/cart/contracts'
import type { CartSummaryPresentation } from '@/components/contracts/cart/drawer'
import { formatMoney } from '@/components/shared/money-display'

export function getCartSummaryPresentation(
  amounts: CartSummaryAmounts,
  locale: string,
): CartSummaryPresentation {
  return {
    discount: amounts.discount
      ? formatMoney(amounts.discount, locale)
      : undefined,
    itemTotal: formatMoney(amounts.itemTotal, locale),
    shipping: amounts.shipping
      ? formatMoney(amounts.shipping, locale)
      : undefined,
    tax: amounts.tax ? formatMoney(amounts.tax, locale) : undefined,
    total: formatMoney(amounts.total, locale),
  }
}
