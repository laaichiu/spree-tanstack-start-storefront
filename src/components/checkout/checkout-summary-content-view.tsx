import type { CheckoutSummaryContentSlots } from '../contracts/checkout'

export type { CheckoutSummaryContentSlots } from '../contracts/checkout'

export function CheckoutSummaryContentView({
  slots,
}: {
  slots: CheckoutSummaryContentSlots
}) {
  return (
    <div className="space-y-8">
      {slots.lineItems}
      {slots.totals}
    </div>
  )
}
