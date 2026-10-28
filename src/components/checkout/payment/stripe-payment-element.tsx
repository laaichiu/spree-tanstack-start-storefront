import { Elements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { useMemo } from 'react'

import { stripePromise } from '@/lib/stripe/client'

import { StripePaymentElementInner } from './stripe-payment-element-inner'
import { useStripePaymentElementAppearance } from './use-stripe-payment-element-appearance'
import type { StripePaymentElementProps } from './stripe-payment-element.types'

export type {
  StripePaymentElementHandle,
  StripePaymentElementProps,
  StripePaymentElementResult,
} from './stripe-payment-element.types'

export function StripePaymentElement({
  clientSecret,
  confirmPaymentFallbackMessage,
  onCompleteChange,
  onElementReady,
  onReady,
  stripeNotLoadedMessage,
}: StripePaymentElementProps) {
  const appearance = useStripePaymentElementAppearance()
  const options = useMemo<StripeElementsOptions | null>(
    () =>
      appearance
        ? {
            appearance: appearance.appearance,
            clientSecret,
          }
        : null,
    [appearance, clientSecret],
  )

  if (!appearance || !options) {
    return null
  }

  return (
    <Elements
      key={`${clientSecret}:${appearance.key}`}
      options={options}
      stripe={stripePromise}
    >
      <StripePaymentElementInner
        confirmPaymentFallbackMessage={confirmPaymentFallbackMessage}
        onCompleteChange={onCompleteChange}
        onElementReady={onElementReady}
        onReady={onReady}
        stripeNotLoadedMessage={stripeNotLoadedMessage}
      />
    </Elements>
  )
}
