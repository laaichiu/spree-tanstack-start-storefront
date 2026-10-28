import { CircleAlert, Loader2 } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import type {
  CheckoutConfirmPaymentPageCapabilities,
  CheckoutConfirmPaymentPageModel,
} from '@/components/contracts/checkout'

export type {
  CheckoutConfirmPaymentPageCapabilities,
  CheckoutConfirmPaymentPageModel,
} from '@/components/contracts/checkout'

export function CheckoutConfirmPaymentPageView({
  capabilities,
  model,
}: {
  capabilities: CheckoutConfirmPaymentPageCapabilities
  model: CheckoutConfirmPaymentPageModel
}) {
  const {
    confirmingDescription,
    confirmingTitle,
    error,
    errorTitle,
    returnLabel,
  } = model

  return (
    <section className="mx-auto flex w-full max-w-checkout flex-col items-center justify-center px-6 py-20 text-center lg:px-14">
      {error ? (
        <>
          <CircleAlert
            aria-hidden="true"
            className="h-8 w-8 text-destructive"
          />
          <h1 className="text-2xl leading-tight md:text-3xl break-words mt-5 font-normal text-foreground">
            {errorTitle}
          </h1>
          <p className="text-xs leading-6 mt-3 text-muted-foreground">
            {error}
          </p>
          {capabilities.renderReturnLink(
            returnLabel,
            buttonClassName({
              className: 'mt-7 min-h-12 min-w-52 px-8',
              size: 'lg',
            }),
          )}
        </>
      ) : (
        <>
          <Loader2
            aria-hidden="true"
            className="h-8 w-8 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
          <h1 className="text-2xl leading-tight md:text-3xl break-words mt-5 font-normal text-foreground">
            {confirmingTitle}
          </h1>
          <p className="text-xs leading-6 mt-3 text-muted-foreground">
            {confirmingDescription}
          </p>
        </>
      )}
    </section>
  )
}
