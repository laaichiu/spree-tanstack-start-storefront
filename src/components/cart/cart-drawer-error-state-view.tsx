import { buttonClassName } from '@/components/ui/button'

import type { CartErrorStateModel } from '@/components/contracts/cart'

export type { CartErrorStateModel } from '@/components/contracts/cart'

type CartDrawerErrorStateViewProps = {
  model: CartErrorStateModel
  onRecover: () => void | Promise<void>
}

export function CartDrawerErrorStateView({
  model,
  onRecover,
}: CartDrawerErrorStateViewProps) {
  return (
    <div className="px-5 py-6">
      <p className="text-xs leading-6 text-destructive">{model.title}</p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        {model.description}
      </p>
      <button
        className={buttonClassName({
          className: 'mt-5 min-h-12 w-full',
          size: 'lg',
        })}
        disabled={model.isPending}
        onClick={() => void onRecover()}
        type="button"
      >
        {model.isPending ? model.pendingActionLabel : model.actionLabel}
      </button>
      {model.error && (
        <p className="mt-4 text-xs leading-6 text-destructive">{model.error}</p>
      )}
    </div>
  )
}
