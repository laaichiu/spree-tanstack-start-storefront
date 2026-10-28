import { AccountSectionHeader, AccountSurface } from './account-ui-view'

import type { AccountOrderSummaryDisplayRow } from './account-order-summary-display'
import type { AccountOrderSummaryModel } from '@/components/contracts/account'

export type { AccountOrderSummaryModel } from '@/components/contracts/account'

export function AccountOrderSummaryView({
  model,
}: {
  model: AccountOrderSummaryModel
}) {
  return (
    <AccountSurface className="h-fit xl:sticky xl:top-6">
      <AccountSectionHeader
        description={model.description}
        title={model.title}
      />
      <div className="mt-6 border border-border bg-muted px-5 py-5">
        <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
          {model.totalLabel}
        </p>
        <p className="mt-2 text-xl leading-none font-normal text-foreground">
          {model.total}
        </p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {model.amountDueMessage}
        </p>
      </div>
      <div className="mt-5 space-y-3 text-xs">
        {model.rows.map((row) => (
          <SummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
        <div className="border-t border-border pt-3">
          <SummaryRow label={model.totalLabel} strong value={model.total} />
        </div>
      </div>
    </AccountSurface>
  )
}

function SummaryRow({
  label,
  strong = false,
  value,
}: AccountOrderSummaryDisplayRow & { strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong ? 'font-normal text-foreground' : 'text-muted-foreground'
        }
      >
        {label}
      </span>
      <span
        className={strong ? 'font-normal text-foreground' : 'text-foreground'}
      >
        {value}
      </span>
    </div>
  )
}
