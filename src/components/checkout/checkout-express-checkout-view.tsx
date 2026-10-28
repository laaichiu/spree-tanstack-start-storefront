import { CircleAlert, Loader2 } from 'lucide-react'
import type {
  CheckoutExpressCheckoutModel,
  CheckoutExpressCheckoutSlots,
} from '../contracts/checkout'

export type {
  CheckoutExpressCheckoutModel,
  CheckoutExpressCheckoutSlots,
} from '../contracts/checkout'

export function CheckoutExpressCheckoutView({
  model,
  slots,
}: {
  model: CheckoutExpressCheckoutModel
  slots: CheckoutExpressCheckoutSlots
}) {
  const {
    error,
    isLoading,
    isProcessing,
    isReady,
    orLabel,
    processingLabel,
    title,
  } = model

  return (
    <section className="space-y-3" data-testid="checkout-express-checkout">
      <p className="text-center text-xs leading-none text-muted-foreground">
        {title}
      </p>
      <div className="relative">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90">
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none"
            />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {processingLabel}
            </p>
          </div>
        )}
        <div className={isLoading ? 'min-h-10' : undefined}>
          {isLoading && (
            <div className="flex h-10 items-center justify-center border border-border bg-background">
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none"
              />
            </div>
          )}
          <div
            className={isReady && !isProcessing ? 'opacity-100' : 'opacity-0'}
          >
            {slots.paymentElement}
          </div>
        </div>
      </div>
      {isReady && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs leading-none text-muted-foreground uppercase">
            {orLabel}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      {error && (
        <div className="border border-destructive bg-muted px-4 py-3">
          <p className="flex items-center gap-2 text-xs leading-5 text-destructive">
            <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </div>
      )}
    </section>
  )
}
