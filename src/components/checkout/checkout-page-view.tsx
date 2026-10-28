import type { CheckoutPageProps } from '@/components/contracts/checkout'

export type {
  CheckoutPageProps,
  CheckoutPageSlots,
} from '@/components/contracts/checkout'

/**
 * The theme owns checkout layout and section order.
 *
 * Checkout state, forms, payment providers, submit behavior, and completion
 * recovery remain runtime-owned capabilities supplied as section slots.
 */
export function CheckoutPageView({ error, slots }: CheckoutPageProps) {
  return (
    <section className="lg:grid lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {slots.summary}

      <section className="lg:col-start-1 lg:row-start-1 lg:min-h-[calc(100vh-5.5rem)] lg:border-r lg:border-border">
        <div className="px-6 py-8 lg:ml-auto lg:flex lg:min-h-full lg:w-full lg:max-w-checkout lg:flex-col lg:px-14 lg:py-12">
          <div className="space-y-9">
            {error && (
              <div className="border border-destructive bg-muted px-4 py-3">
                <p className="text-xs leading-6 text-destructive">{error}</p>
              </div>
            )}

            {slots.express}
            {slots.delivery}
            {slots.payment}
            {slots.submit}
          </div>
        </div>
      </section>
    </section>
  )
}
