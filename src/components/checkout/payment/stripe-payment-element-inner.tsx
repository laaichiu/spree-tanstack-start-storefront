import { PaymentElement } from '@stripe/react-stripe-js'
import { CircleAlert } from 'lucide-react'

import { useStripePaymentElementController } from './use-stripe-payment-element-controller'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'

export function StripePaymentElementInner({
  confirmPaymentFallbackMessage,
  onCompleteChange,
  onElementReady,
  onReady,
  stripeNotLoadedMessage,
}: {
  confirmPaymentFallbackMessage: string
  onCompleteChange?: (complete: boolean) => void
  onElementReady?: () => void
  onReady: (handle: StripePaymentElementHandle) => void
  stripeNotLoadedMessage: string
}) {
  const { error, handlePaymentElementChange } =
    useStripePaymentElementController({
      confirmPaymentFallbackMessage,
      onCompleteChange,
      onReady,
      stripeNotLoadedMessage,
    })

  return (
    <div className="space-y-3">
      <PaymentElement
        onChange={handlePaymentElementChange}
        onReady={onElementReady}
        options={{
          layout: 'tabs',
        }}
      />
      {error ? (
        <div className="border border-destructive bg-muted px-4 py-3">
          <p className="flex items-center gap-2 text-sm leading-5 text-destructive">
            <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </div>
      ) : null}
    </div>
  )
}
