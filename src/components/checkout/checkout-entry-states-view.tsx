import { CircleAlert } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import type {
  CheckoutLoadErrorStateModel,
  CheckoutLoadingStateModel,
  CheckoutUnavailableStateCapabilities,
  CheckoutUnavailableStateModel,
} from '../contracts/checkout'

export type {
  CheckoutLoadErrorStateModel,
  CheckoutLoadingStateModel,
  CheckoutUnavailableStateCapabilities,
  CheckoutUnavailableStateModel,
} from '../contracts/checkout'

export function CheckoutLoadingStateView({
  model,
}: {
  model: CheckoutLoadingStateModel
}) {
  return (
    <section className="px-4 py-14 lg:px-8">
      <p className="text-xs leading-6 text-muted-foreground">{model.message}</p>
    </section>
  )
}

export function CheckoutLoadErrorStateView({
  model,
  onReset,
}: {
  model: CheckoutLoadErrorStateModel
  onReset: () => void
}) {
  return (
    <section className="px-4 py-14 lg:px-8">
      <div className="max-w-3xl border border-destructive bg-muted px-5 py-5">
        <div className="flex gap-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs leading-6">{model.errorTitle}</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {model.errorMessage}
            </p>
          </div>
        </div>
        <button
          className={buttonClassName({
            className: 'mt-5 min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          disabled={model.isResetPending}
          onClick={onReset}
          type="button"
        >
          {model.isResetPending ? model.resettingLabel : model.resetLabel}
        </button>
      </div>
    </section>
  )
}

export function CheckoutUnavailableStateView({
  capabilities,
  model,
}: {
  capabilities: CheckoutUnavailableStateCapabilities
  model: CheckoutUnavailableStateModel
}) {
  return (
    <section className="flex min-h-[calc(100vh-9.75rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
          {model.eyebrow}
        </p>
        <h1 className="text-2xl leading-tight md:text-3xl break-words mt-4 font-normal text-foreground">
          {model.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
        <div className="mt-7 flex justify-center">
          {capabilities.renderProductsLink(
            model.shopAllProductsLabel,
            buttonClassName({
              className: 'min-h-12 min-w-56 px-8',
              size: 'lg',
            }),
          )}
        </div>
      </div>
    </section>
  )
}
