import type { ReactNode } from 'react'

import type { AccountOrdersSectionModel } from '@/components/contracts/account'
import {
  AccountOrderListItemView,
  AccountOrderListView,
} from './account-order-list-item-view'
import { AccountOrderListStateView } from './account-order-list-state-view'

export type { AccountOrdersSectionLabels } from '@/components/contracts/account'

type AccountOrdersSectionProps = {
  model: AccountOrdersSectionModel
  renderEmptyAction?: (props: {
    children: ReactNode
    className: string
  }) => ReactNode
  renderViewLink?: (
    orderId: string,
    props: { children: ReactNode; className: string },
  ) => ReactNode
}

export function AccountOrdersSectionView({
  model,
  renderEmptyAction,
  renderViewLink,
}: AccountOrdersSectionProps) {
  if (model.status === 'error') {
    return (
      <AccountOrderListStateView
        model={{
          description: model.labels.errorDescription,
          state: 'error',
          title: model.labels.errorTitle,
        }}
      />
    )
  }

  if (model.status === 'empty') {
    return (
      <AccountOrderListStateView
        actionLabel={model.labels.emptyAction}
        model={{
          description: model.labels.emptyDescription,
          state: 'empty',
          title: model.labels.emptyTitle,
        }}
        renderAction={renderEmptyAction}
      />
    )
  }

  return (
    <AccountOrderListView
      description={model.labels.readyDescription}
      title={model.labels.readyTitle}
    >
      {model.orders.map((order) => (
        <AccountOrderListItemView
          key={order.order.id}
          model={order}
          renderViewLink={(linkProps) =>
            renderViewLink?.(order.order.id, linkProps) ?? linkProps.children
          }
        />
      ))}
    </AccountOrderListView>
  )
}
