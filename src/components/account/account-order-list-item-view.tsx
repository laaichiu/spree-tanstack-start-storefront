import type { ReactNode } from 'react'

import type { AccountOrderListItemModel } from '@/components/contracts/account'
import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
  accountTextLinkClassName,
} from './account-ui-view'

export type {
  AccountOrderListItemLabels,
  AccountOrderListItemModel,
} from '@/components/contracts/account'

export function AccountOrderListItemView({
  model,
  renderViewLink,
}: {
  model: AccountOrderListItemModel
  renderViewLink: (props: {
    children: ReactNode
    className: string
  }) => ReactNode
}) {
  const { labels, order } = model

  return (
    <li className="border-b border-border py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
              {labels.order}
            </p>
            <h2 className="text-xs font-normal text-foreground">
              #{order.number}
            </h2>
          </div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {order.dateLabel}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AccountPill>{order.paymentStatus}</AccountPill>
            <AccountPill>{order.fulfillmentStatus}</AccountPill>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <p className="text-xs font-normal text-foreground">
            {order.displayTotal ?? '—'}
          </p>
          {renderViewLink({
            children: labels.view,
            className: accountTextLinkClassName,
          })}
        </div>
      </div>
    </li>
  )
}

export function AccountOrderListView({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <AccountSurface>
      <AccountSectionHeader description={description} title={title} />
      <ul className="mt-6">{children}</ul>
    </AccountSurface>
  )
}
