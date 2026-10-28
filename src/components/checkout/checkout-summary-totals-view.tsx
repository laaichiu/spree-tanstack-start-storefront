import type { ReactNode } from 'react'

import { cn } from '@/components/ui/utils'
import type { CheckoutSummaryTotalsRowDisplay } from './summary/checkout-summary-totals-row-display'

import type {
  CheckoutSummaryTotalsModel,
  CheckoutSummaryTotalsDetailRow,
} from '../contracts/checkout'

export type {
  CheckoutSummaryTotalsLabels,
  CheckoutSummaryTotalsModel,
  CheckoutSummaryTotalsDetailRow,
} from '../contracts/checkout'

export function CheckoutSummaryTotalsView({
  discountCodeForm,
  model,
}: {
  discountCodeForm: ReactNode
  model: CheckoutSummaryTotalsModel
}) {
  return (
    <div className="space-y-3 pt-6">
      {discountCodeForm}

      <div className="space-y-3 pt-5">
        {model.rows.map((row) => (
          <div key={row.label}>
            <SummaryRow kind={row.kind} label={row.label} value={row.value} />
            {row.details && row.details.length > 0 && (
              <div className="space-y-1">
                {row.details.map((detail) => (
                  <SummaryDetailRow
                    key={detail.label}
                    label={detail.label}
                    value={detail.value}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs leading-6 font-normal text-foreground">
              {model.labels.total}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs tracking-wider text-muted-foreground uppercase">
                {model.currencyCode}
              </span>
              <span className="text-2xl leading-none text-foreground">
                {model.total}
              </span>
            </div>
          </div>
          {model.amountDue && (
            <div className="mt-3 flex items-baseline justify-between gap-4 text-xs leading-5">
              <span className="text-muted-foreground">
                {model.labels.amountDue}
              </span>
              <span className="text-foreground">{model.amountDue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  kind,
  label,
  value,
}: {
  kind: CheckoutSummaryTotalsRowDisplay['kind']
  label: string
  value: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs leading-5">
      <span className="text-muted-foreground">{label}</span>
      <div
        className={cn(
          'text-right text-foreground',
          kind === 'discount' ? 'text-green-700' : undefined,
        )}
      >
        {value}
      </div>
    </div>
  )
}

function SummaryDetailRow({ label, value }: CheckoutSummaryTotalsDetailRow) {
  return (
    <div className="flex items-baseline justify-between gap-4 pl-4 text-xs leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  )
}
