import type { CommerceStatusLabels } from '@/components/shared/commerce-status-labels'
import type { OrderPayment } from '@/lib/account/contracts'
import { formatStatusLabel } from '@/components/shared/status-label'

export type AccountOrderPaymentDisplay = {
  amount: string
  authorizationCode?: string
  id: string
  methodName: string
  reference?: string
  sourceLabel?: string
  statusLabel: string
}

export function getOrderPaymentAccountDisplays({
  labels,
  payments,
}: {
  labels: {
    statusLabels: CommerceStatusLabels
    paymentMethodUnavailable: string
    statusFallback: string
  }
  payments: readonly OrderPayment[]
}): AccountOrderPaymentDisplay[] {
  return payments.map((payment) => ({
    amount: payment.displayAmount ?? '—',
    authorizationCode: payment.responseCode ?? undefined,
    id: payment.id,
    methodName: payment.methodName || labels.paymentMethodUnavailable,
    reference: payment.number || undefined,
    sourceLabel: payment.sourceLabel ?? undefined,
    statusLabel: formatStatusLabel(
      payment.status,
      labels.statusFallback,
      labels.statusLabels.payment,
    ),
  }))
}
