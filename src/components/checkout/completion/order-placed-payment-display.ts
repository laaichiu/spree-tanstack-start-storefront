import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { CheckoutPayment } from '@/lib/checkout/contracts'
import { formatStatusLabel } from '@/components/shared/status-label'

export type OrderPlacedPaymentStatusDisplay = {
  amount: string
  id: string
  methodName: string
  sourceLabel: string | null
  status: string
}

export function getOrderPlacedPaymentDisplays({
  labels,
  payments,
}: {
  labels: {
    statusLabels: CommerceStatusLabels
    paymentMethodUnavailable: string
    statusFallback: string
  }
  payments: readonly CheckoutPayment[]
}): OrderPlacedPaymentStatusDisplay[] {
  return payments.map((payment) => ({
    amount: payment.displayAmount ?? '—',
    id: payment.id,
    methodName: payment.methodName || labels.paymentMethodUnavailable,
    sourceLabel: payment.sourceLabel,
    status: formatStatusLabel(
      payment.status,
      labels.statusFallback,
      labels.statusLabels.payment,
    ),
  }))
}
