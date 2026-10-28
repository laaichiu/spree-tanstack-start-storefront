import { getOrderSummaryAmounts } from '@/lib/account/contracts'
import type {
  OrderDetail,
  OrderSummaryAmountKind,
} from '@/lib/account/contracts'
import { hasMeaningfulAmount } from '@/lib/core/money'

export type AccountOrderSummaryDisplayRow = {
  label: string
  value: string
}

export type AccountOrderSummaryDisplay = {
  amountDueMessage: string
  rows: AccountOrderSummaryDisplayRow[]
  total: string
}

export function getOrderSummaryAccountDisplay({
  labels,
  order,
}: {
  labels: {
    amountDue: string
    amountLabels: Readonly<Record<OrderSummaryAmountKind, string>>
    orderPaidInFull: string
  }
  order: OrderDetail
}): AccountOrderSummaryDisplay {
  const amounts = getOrderSummaryAmounts(order)

  return {
    amountDueMessage: hasMeaningfulAmount(order.amountDue)
      ? `${labels.amountDue}: ${amounts.amountDue ?? '—'}`
      : labels.orderPaidInFull,
    rows: amounts.rows.map((row) => ({
      label: labels.amountLabels[row.kind],
      value: row.value ?? '—',
    })),
    total: amounts.total ?? '—',
  }
}
