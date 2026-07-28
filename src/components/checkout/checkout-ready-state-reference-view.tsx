import type { CheckoutReadyStateControllerValue } from '@/components/checkout/checkout-ready-state-controller'

export function CheckoutReadyStateReferenceView({
  controller,
}: {
  controller: CheckoutReadyStateControllerValue
}) {
  return (
    <section className="lg:grid lg:min-h-checkout lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {controller.summary}

      <section className="lg:col-start-1 lg:row-start-1 lg:min-h-checkout lg:border-r lg:border-border">
        <div className="px-6 py-8 lg:ml-auto lg:flex lg:min-h-full lg:w-full lg:max-w-checkout lg:flex-col lg:px-14 lg:py-12">
          <div className="w-full space-y-9">
            {controller.checkoutError ? (
              <div className="border border-destructive bg-muted px-4 py-3">
                <p className="text-sm leading-6 text-destructive">
                  {controller.checkoutError}
                </p>
              </div>
            ) : null}

            {controller.express}
            {controller.delivery}
            {controller.payment}
            {controller.submit}
          </div>
        </div>
      </section>
    </section>
  )
}
