import type { ReactNode } from 'react'

import type { CheckoutSummaryPresentation } from './checkout-summary-display'
import { CheckoutSummaryShellView } from '@/components/checkout/checkout-summary-shell-view'

export function CheckoutSummaryShell({
  isMobileOpen,
  model,
  onMobileToggle,
  summaryContent,
  summaryLabel,
}: {
  isMobileOpen: boolean
  model: CheckoutSummaryPresentation
  onMobileToggle: () => void
  summaryContent: ReactNode
  summaryLabel: string
}) {
  return (
    <CheckoutSummaryShellView
      content={summaryContent}
      model={{ isMobileOpen, label: summaryLabel, total: model.total }}
      onMobileToggle={onMobileToggle}
    />
  )
}
