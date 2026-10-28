import { CircleCheckBig } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'

import type { OrderPlacedPageProps } from '@/components/contracts/checkout'

export type {
  OrderPlacedPageCapabilities,
  OrderPlacedPageCopy,
  OrderPlacedPageDisplayModel,
  OrderPlacedPageProps,
} from '@/components/contracts/checkout'

/**
 * The theme owns completed-order page layout and action placement.
 * Completed-order access validation, detail data, and status formatting stay
 * runtime-owned capabilities supplied through the page model and details prop.
 */
export function OrderPlacedPageView({
  capabilities,
  details,
  model,
}: OrderPlacedPageProps) {
  const { copy } = model

  if (model.status === 'unavailable') {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-checkout flex-col items-center justify-center px-6 py-14 text-center lg:px-14">
        <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal text-foreground">
          {copy.unavailableTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-muted-foreground">
          {copy.unavailableDescription}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {capabilities.renderProductsLink(
            copy.continueShopping,
            buttonClassName({
              className: 'min-h-12 min-w-52 px-8',
              size: 'lg',
            }),
          )}
          {capabilities.renderStorefrontLink(
            copy.backToStorefront,
            buttonClassName({
              className: 'min-h-12 min-w-52 px-8',
              size: 'lg',
              variant: 'secondary',
            }),
          )}
        </div>
      </main>
    )
  }

  const { header } = model

  return (
    <main className="mx-auto w-full max-w-checkout space-y-10 px-6 py-8 lg:px-14 lg:py-10">
      <header className="space-y-4 border-b border-border pb-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
            <CircleCheckBig
              aria-hidden="true"
              className="h-8 w-8 text-foreground"
            />
          </div>
        </div>
        <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
          {copy.order} {header.number}
        </p>
        <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal text-foreground">
          {header.firstName
            ? `${copy.thanksForOrder}, ${header.firstName}`
            : copy.orderPlacedTitle}
        </h1>
        <p className="mx-auto max-w-md text-xs leading-6 text-muted-foreground">
          {copy.orderPlacedPreparing}
        </p>
        {header.email ? (
          <p className="text-xs leading-6 text-muted-foreground">
            {copy.confirmationSentTo}{' '}
            <span className="font-normal text-foreground">{header.email}</span>
          </p>
        ) : (
          <p className="text-xs leading-6 text-foreground">
            {copy.orderReference} {header.number}
          </p>
        )}
      </header>

      {details}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {capabilities.renderStorefrontLink(
          copy.backToStorefront,
          buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
          }),
        )}
        {capabilities.renderProductsLink(
          copy.continueShopping,
          buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
            variant: 'secondary',
          }),
        )}
      </div>
    </main>
  )
}
