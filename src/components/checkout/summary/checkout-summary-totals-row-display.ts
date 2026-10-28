import type { CheckoutSummaryPresentationRow } from './checkout-summary-display'

export type CheckoutSummaryTotalsRowDisplay = {
  details?: readonly { label: string; value: string }[]
  kind: CheckoutSummaryPresentationRow['kind']
  label: string
  value: string
}

export function getCheckoutSummaryTotalsRowDisplays(
  rows: readonly CheckoutSummaryPresentationRow[],
): CheckoutSummaryTotalsRowDisplay[] {
  return rows.map(({ details, kind, label, value }) => ({
    details: details.length > 0 ? details : undefined,
    kind,
    label,
    value,
  }))
}
