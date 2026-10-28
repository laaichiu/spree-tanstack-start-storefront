import { buttonClassName } from '@/components/ui/button'

import type { CartErrorStateModel } from '@/components/contracts/cart'

export type { CartErrorStateModel } from '@/components/contracts/cart'

type CartErrorStateViewProps = {
  model: CartErrorStateModel
  onRecover: () => void | Promise<void>
}

export function CartErrorStateView({
  model,
  onRecover,
}: CartErrorStateViewProps) {
  return (
    <section className="w-full px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-3xl border border-destructive bg-muted p-6 sm:p-8">
        <p className="text-xs leading-4 font-normal uppercase text-destructive">
          {model.title}
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
        <button
          className={buttonClassName({
            className: 'mt-6 min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          disabled={model.isPending}
          onClick={() => void onRecover()}
          type="button"
        >
          {model.isPending ? model.pendingActionLabel : model.actionLabel}
        </button>
        {model.error && (
          <p className="mt-4 text-xs leading-6 text-destructive">
            {model.error}
          </p>
        )}
      </div>
    </section>
  )
}
