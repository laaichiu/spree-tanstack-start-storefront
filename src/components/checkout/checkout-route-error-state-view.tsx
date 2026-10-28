import { CircleAlert } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import type {
  CheckoutRouteErrorStateCapabilities,
  CheckoutRouteErrorStateModel,
} from '../contracts/checkout'

export type {
  CheckoutRouteErrorStateCapabilities,
  CheckoutRouteErrorStateModel,
} from '../contracts/checkout'

export function CheckoutRouteErrorStateView({
  capabilities,
  model,
}: {
  capabilities: CheckoutRouteErrorStateCapabilities
  model: CheckoutRouteErrorStateModel
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-checkout flex-col items-center justify-center px-6 py-14 text-center lg:px-14">
      <CircleAlert aria-hidden="true" className="h-9 w-9 text-destructive" />
      <p className="mt-6 text-xs leading-4 font-normal uppercase text-muted-foreground">
        {model.eyebrow}
      </p>
      <h1 className="text-2xl leading-tight md:text-3xl break-words mt-4 font-normal text-foreground">
        {model.title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-muted-foreground">
        {model.description}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {capabilities.renderCheckoutLink &&
          model.checkoutLabel &&
          capabilities.renderCheckoutLink(
            model.checkoutLabel,
            buttonClassName({
              className: 'min-h-12 min-w-52 px-8',
              size: 'lg',
            }),
          )}
        {capabilities.renderProductsLink(
          model.productsLabel,
          buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
            variant:
              capabilities.renderCheckoutLink && model.checkoutLabel
                ? 'secondary'
                : undefined,
          }),
        )}
      </div>
    </main>
  )
}
