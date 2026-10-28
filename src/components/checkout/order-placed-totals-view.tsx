import type { OrderPlacedTotalsModel } from '../contracts/checkout'
import type { OrderPlacedTotalRow } from './completion/order-placed-totals-display'

export type { OrderPlacedTotalsModel } from '../contracts/checkout'

export function OrderPlacedTotalsView({
  model,
}: {
  model: OrderPlacedTotalsModel
}) {
  return (
    <section className="space-y-3 border border-border p-5">
      <h2 className="text-lg md:text-xl font-normal text-foreground">
        {model.title}
      </h2>
      {model.rows.map((row) => (
        <TotalRow key={row.label} {...row} />
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
        <span className="text-xs leading-6 font-normal text-foreground">
          {model.totalLabel}
        </span>
        <span className="text-right text-xs leading-6 font-normal text-foreground">
          {model.totalValue}
        </span>
      </div>
      <div className="space-y-3 border-t border-border pt-4">
        {model.statusRows.map((row) => (
          <StatusRow key={row.label} {...row} />
        ))}
      </div>
    </section>
  )
}

function TotalRow({ label, value }: OrderPlacedTotalRow) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}

function StatusRow({ label, value }: OrderPlacedTotalRow) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}
