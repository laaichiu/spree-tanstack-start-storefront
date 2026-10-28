import { AccountPill, AccountSurface } from './account-ui-view'

import type { AccountOrderHeaderModel } from '@/components/contracts/account'

export type {
  AccountOrderHeaderLabels,
  AccountOrderHeaderModel,
} from '@/components/contracts/account'

export function AccountOrderHeaderView({
  model,
}: {
  model: AccountOrderHeaderModel
}) {
  const { labels } = model

  return (
    <AccountSurface>
      <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {labels.order}
      </p>
      <h1 className="text-2xl leading-tight md:text-3xl break-words mt-3 font-normal text-foreground">
        {labels.orderTitlePrefix} {model.order.number}
      </h1>
      <p className="mt-3 text-xs leading-7 text-muted-foreground">
        {labels.placedOn} {model.dateLabel}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <AccountPill>{labels.paymentStatus}</AccountPill>
        <AccountPill>{labels.fulfillmentStatus}</AccountPill>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <OrderMetaStat
          label={labels.items}
          value={String(model.order.totalQuantity)}
        />
        <OrderMetaStat
          label={labels.shipments}
          value={String(model.order.fulfillmentCount)}
        />
        <OrderMetaStat
          label={labels.amountDue}
          value={model.order.displayAmountDue ?? '—'}
        />
      </div>

      {model.order.customerNote && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
            {labels.specialInstructions}
          </p>
          <p className="mt-3 border border-border bg-muted px-4 py-4 text-xs leading-7 whitespace-pre-wrap text-muted-foreground">
            {model.order.customerNote}
          </p>
        </div>
      )}
    </AccountSurface>
  )
}

function OrderMetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted px-4 py-3">
      <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xs font-normal text-foreground">{value}</p>
    </div>
  )
}
