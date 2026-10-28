import { PaymentElement } from '@stripe/react-stripe-js'

import { StripePaymentElementErrorView } from '@/components/checkout/stripe-payment-element-error-view'
import { StripePaymentElementShellView } from '@/components/checkout/stripe-payment-element-shell-view'
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
    <StripePaymentElementShellView>
      <PaymentElement
        onChange={handlePaymentElementChange}
        onReady={onElementReady}
        options={{
          layout: 'tabs',
        }}
      />
      {error && <StripePaymentElementErrorView message={error} />}
    </StripePaymentElementShellView>
  )
}
