import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { formatMoney } from '@/components/shared/money-display'

export type OrderPlacedTotalRow = {
  label: string
  value: string
}

export type OrderPlacedTotalsDisplay = {
  rows: OrderPlacedTotalRow[]
  total: string
}

export function getOrderPlacedTotalsDisplay({
  labels,
  locale,
  order,
}: {
  labels: {
    discount: string
    shipping: string
    subtotal: string
    tax: string
  }
  locale: string
  order: Pick<
    CheckoutOrder,
    'deliveryTotal' | 'discountTotal' | 'itemTotal' | 'taxTotal' | 'total'
  >
}): OrderPlacedTotalsDisplay {
  return {
    rows: [
      {
        label: labels.subtotal,
        value: formatMoney(order.itemTotal, locale),
      },
      {
        label: labels.shipping,
        value: formatMoney(order.deliveryTotal, locale),
      },
      {
        label: labels.discount,
        value: formatMoney(order.discountTotal, locale),
      },
      {
        label: labels.tax,
        value: formatMoney(order.taxTotal, locale),
      },
    ],
    total: formatMoney(order.total, locale),
  }
}
