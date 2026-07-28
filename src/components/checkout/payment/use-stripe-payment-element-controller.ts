import { useCallback, useEffect, useState } from 'react'
import { useElements, useStripe } from '@stripe/react-stripe-js'

import type {
  StripePaymentElementHandle,
  StripePaymentElementResult,
} from './stripe-payment-element.types'

type StripePaymentElementControllerOptions = {
  confirmPaymentFallbackMessage: string
  onCompleteChange?: (complete: boolean) => void
  onReady: (handle: StripePaymentElementHandle) => void
  stripeNotLoadedMessage: string
}

export function useStripePaymentElementController({
  confirmPaymentFallbackMessage,
  onCompleteChange,
  onReady,
  stripeNotLoadedMessage,
}: StripePaymentElementControllerOptions) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)

  const validatePayment =
    useCallback(async (): Promise<StripePaymentElementResult> => {
      if (!stripe || !elements) {
        return { error: stripeNotLoadedMessage }
      }

      setError(null)

      const result = await elements.submit()

      if (result.error) {
        return {
          displayError: false,
          error: result.error.message || confirmPaymentFallbackMessage,
        }
      }

      return {}
    }, [
      confirmPaymentFallbackMessage,
      elements,
      stripe,
      stripeNotLoadedMessage,
    ])

  const confirmPayment = useCallback(
    async (returnUrl: string): Promise<StripePaymentElementResult> => {
      if (!stripe || !elements) {
        return { error: stripeNotLoadedMessage }
      }

      const validationResult = await validatePayment()

      if (validationResult.error) {
        return validationResult
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        const message = result.error.message || confirmPaymentFallbackMessage
        setError(message)

        return { error: message }
      }

      return {}
    },
    [
      confirmPaymentFallbackMessage,
      elements,
      stripe,
      stripeNotLoadedMessage,
      validatePayment,
    ],
  )

  const fetchUpdates = useCallback(async () => {
    if (!elements) {
      return
    }

    await elements.fetchUpdates()
  }, [elements])

  useEffect(() => {
    if (!stripe || !elements) {
      return
    }

    onReady({
      confirmPayment,
      fetchUpdates,
    })
  }, [confirmPayment, elements, fetchUpdates, onReady, stripe])

  const handlePaymentElementChange = useCallback(
    ({ complete }: { complete: boolean }) => {
      onCompleteChange?.(complete)

      if (complete) {
        setError(null)
      }
    },
    [onCompleteChange],
  )

  return {
    error,
    handlePaymentElementChange,
    confirmPayment,
    fetchUpdates,
  }
}
