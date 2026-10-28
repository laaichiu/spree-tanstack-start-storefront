import { CircleAlert, ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'

import { buttonClassName } from '@/components/ui/button'
import type { AccountOrderListStateModel } from '@/components/contracts/account'

import { AccountEmptyState } from './account-ui-view'

export type { AccountOrderListStateModel } from '@/components/contracts/account'

export function AccountOrderListStateView({
  actionLabel,
  model,
  renderAction,
}: {
  actionLabel?: string
  model: AccountOrderListStateModel
  renderAction?: (props: {
    children: ReactNode
    className: string
  }) => ReactNode
}) {
  const isError = model.state === 'error'

  return (
    <AccountEmptyState
      action={
        isError || !actionLabel || !renderAction
          ? undefined
          : renderAction({
              children: actionLabel,
              className: buttonClassName(),
            })
      }
      description={model.description}
      icon={
        isError ? (
          <CircleAlert aria-hidden="true" className="h-5 w-5" />
        ) : (
          <ShoppingBag aria-hidden="true" className="h-5 w-5" />
        )
      }
      title={model.title}
    />
  )
}
