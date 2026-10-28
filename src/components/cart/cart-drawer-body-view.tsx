import type { ReactNode } from 'react'

import type {
  CartDrawerBodyModel,
  CartLinkRenderer,
} from '@/components/contracts/cart'
import { CartDrawerEmptyStateView } from './cart-drawer-empty-state-view'
import { CartDrawerErrorStateView } from './cart-drawer-error-state-view'

export type { CartDrawerBodyModel } from '@/components/contracts/cart'

export function CartDrawerBodyView({
  items,
  model,
  onRecover,
  renderShopLink,
}: {
  items: ReactNode
  model: CartDrawerBodyModel
  onRecover: () => void | Promise<void>
  renderShopLink: CartLinkRenderer
}) {
  if (model.status === 'loading') {
    return (
      <p className="px-5 py-6 text-xs leading-6 text-muted-foreground">
        {model.loadingLabel}
      </p>
    )
  }

  if (model.status === 'error') {
    return (
      <CartDrawerErrorStateView model={model.error} onRecover={onRecover} />
    )
  }

  if (model.status === 'empty') {
    return (
      <CartDrawerEmptyStateView
        model={model.empty}
        renderShopLink={renderShopLink}
      />
    )
  }

  return (
    <>
      {model.mutationError && (
        <p className="px-5 pt-6 pb-4 text-xs leading-6 text-destructive">
          {model.mutationError}
        </p>
      )}
      {items}
    </>
  )
}
