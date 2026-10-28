import { useCallback, useRef, useState } from 'react'

import type { StripePaymentElementHandle } from './stripe-payment-element.types'

export function useCheckoutStripePaymentElement({
  ownerKey,
}: {
  ownerKey: string
}) {
  const [readyStripeElementOwner, setReadyStripeElementOwner] = useState<
    string | null
  >(null)
  const [completeStripeElementOwner, setCompleteStripeElementOwner] = useState<
    string | null
  >(null)
  const stripePaymentHandleRef = useRef<StripePaymentElementHandle | null>(null)
  const currentOwnerRef = useRef(ownerKey)

  if (currentOwnerRef.current !== ownerKey) {
    currentOwnerRef.current = ownerKey
    stripePaymentHandleRef.current = null
  }

  const handleStripeElementReady = useCallback(() => {
    if (currentOwnerRef.current !== ownerKey) {
      return
    }

    setReadyStripeElementOwner(ownerKey)
  }, [ownerKey])

  const handleStripeElementCompleteChange = useCallback(
    (complete: boolean) => {
      if (currentOwnerRef.current !== ownerKey) {
        return
      }

      setCompleteStripeElementOwner(complete ? ownerKey : null)
    },
    [ownerKey],
  )

  const handleStripeReady = useCallback(
    (handle: StripePaymentElementHandle) => {
      if (currentOwnerRef.current !== ownerKey) {
        return
      }

      stripePaymentHandleRef.current = handle
    },
    [ownerKey],
  )

  const resetStripePaymentElement = useCallback(() => {
    stripePaymentHandleRef.current = null
    setReadyStripeElementOwner(null)
    setCompleteStripeElementOwner(null)
  }, [])

  return {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    isStripeElementComplete: completeStripeElementOwner === ownerKey,
    isStripeElementReady: readyStripeElementOwner === ownerKey,
    resetStripePaymentElement,
    stripePaymentHandleRef,
  }
}
