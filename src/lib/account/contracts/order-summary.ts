import { hasMeaningfulAmount } from '@/lib/core/money'
import type { OrderDetail } from './order'

export const ORDER_SUMMARY_AMOUNT_KINDS = [
  'subtotal',
  'shipping',
  'discount',
  'tax',
  'gift-card',
  'store-credit',
] as const

export type OrderSummaryAmountKind = (typeof ORDER_SUMMARY_AMOUNT_KINDS)[number]

export type OrderSummaryAmount = {
  kind: OrderSummaryAmountKind
  value: string | null
}

export type OrderSummaryAmounts = {
  amountDue: string | null
  rows: OrderSummaryAmount[]
  total: string | null
}

type OrderSummaryInput = Pick<
  OrderDetail,
  | 'amountDue'
  | 'discountTotal'
  | 'displayAmountDue'
  | 'displayDeliveryTotal'
  | 'displayDiscountTotal'
  | 'displayGiftCardTotal'
  | 'displayItemTotal'
  | 'displayStoreCreditTotal'
  | 'displayTaxTotal'
  | 'displayTotal'
  | 'giftCardTotal'
  | 'storeCreditTotal'
  | 'taxTotal'
>

export function getOrderSummaryAmounts(
  order: OrderSummaryInput,
): OrderSummaryAmounts {
  return {
    amountDue: order.displayAmountDue,
    rows: [
      { kind: 'subtotal', value: order.displayItemTotal },
      { kind: 'shipping', value: order.displayDeliveryTotal },
      ...(hasMeaningfulAmount(order.discountTotal)
        ? [{ kind: 'discount' as const, value: order.displayDiscountTotal }]
        : []),
      ...(hasMeaningfulAmount(order.taxTotal)
        ? [{ kind: 'tax' as const, value: order.displayTaxTotal }]
        : []),
      ...(hasMeaningfulAmount(order.giftCardTotal)
        ? [{ kind: 'gift-card' as const, value: order.displayGiftCardTotal }]
        : []),
      ...(hasMeaningfulAmount(order.storeCreditTotal)
        ? [
            {
              kind: 'store-credit' as const,
              value: order.displayStoreCreditTotal,
            },
          ]
        : []),
    ],
    total: order.displayTotal,
  }
}
