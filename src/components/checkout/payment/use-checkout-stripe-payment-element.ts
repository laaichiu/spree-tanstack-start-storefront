import { useCallback, useRef, useState } from 'react'

import type { StripePaymentElementHandle } from './stripe-payment-element.types'

export function useCheckoutStripePaymentElement() {
  const [isStripeElementReady, setIsStripeElementReady] = useState(false)
  const [isStripeElementComplete, setIsStripeElementComplete] = useState(false)
  const stripePaymentHandleRef = useRef<StripePaymentElementHandle | null>(null)

  const handleStripeElementReady = useCallback(() => {
    setIsStripeElementReady(true)
  }, [])

  const handleStripeElementCompleteChange = useCallback((complete: boolean) => {
    setIsStripeElementComplete(complete)
  }, [])

  const handleStripeReady = useCallback(
    (handle: StripePaymentElementHandle) => {
      stripePaymentHandleRef.current = handle
    },
    [],
  )

  const resetStripePaymentElement = useCallback(() => {
    stripePaymentHandleRef.current = null
    setIsStripeElementReady(false)
    setIsStripeElementComplete(false)
  }, [])

  return {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    isStripeElementComplete,
    isStripeElementReady,
    resetStripePaymentElement,
    stripePaymentHandleRef,
  }
}
