import { buttonClassName } from '@/components/ui/button'

import type {
  CartDrawerEmptyStateModel,
  CartLinkRenderer,
} from '@/components/contracts/cart'

export type { CartDrawerEmptyStateModel } from '@/components/contracts/cart'

type CartDrawerEmptyStateViewProps = {
  model: CartDrawerEmptyStateModel
  renderShopLink: CartLinkRenderer
}

export function CartDrawerEmptyStateView({
  model,
  renderShopLink,
}: CartDrawerEmptyStateViewProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-16 text-center">
      <h2 className="text-lg md:text-xl mt-7 font-normal tracking-wider text-foreground">
        {model.title}
      </h2>
      <p className="mt-4 max-w-md text-xs leading-6 text-muted-foreground">
        {model.description}
      </p>
      {renderShopLink(
        model.actionLabel,
        buttonClassName({
          className: 'mt-8 min-h-13 px-8',
          size: 'lg',
        }),
      )}
    </div>
  )
}
