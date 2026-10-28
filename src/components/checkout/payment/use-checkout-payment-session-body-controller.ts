import { useCallback, useRef, useState } from 'react'

import type { CheckoutPaymentSession } from '@/lib/checkout/utils/payment/payment-session-contract'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'

export function useCheckoutPaymentSessionBodyController({
  clientSecret,
  disabled,
  isBusy,
  onStripeElementCompleteChange,
  onStripeElementReady,
  onStripeReady,
  paymentSession,
  selectedSavedPaymentProfileId,
}: {
  clientSecret?: string
  disabled: boolean
  isBusy: boolean
  onStripeElementCompleteChange: (complete: boolean) => void
  onStripeElementReady: () => void
  onStripeReady: (handle: StripePaymentElementHandle) => void
  paymentSession: CheckoutPaymentSession | null
  selectedSavedPaymentProfileId: string | null
}) {
  const paymentElementContextKey = JSON.stringify([
    clientSecret ?? null,
    selectedSavedPaymentProfileId,
  ])
  const paymentElementGenerationRef = useRef(0)
  const previousPaymentElementContextKeyRef = useRef(paymentElementContextKey)

  if (
    previousPaymentElementContextKeyRef.current !== paymentElementContextKey
  ) {
    previousPaymentElementContextKeyRef.current = paymentElementContextKey
    paymentElementGenerationRef.current += 1
  }

  const paymentElementOwner = `${paymentElementGenerationRef.current}:${paymentElementContextKey}`
  const currentPaymentElementOwnerRef = useRef(paymentElementOwner)
  currentPaymentElementOwnerRef.current = paymentElementOwner
  const [readyPaymentElementOwner, setReadyPaymentElementOwner] = useState<
    string | null
  >(null)
  const hasSelectedSavedPaymentCard = Boolean(selectedSavedPaymentProfileId)
  const showStripePaymentElement =
    Boolean(clientSecret) && !hasSelectedSavedPaymentCard
  const isStripePaymentElementReady =
    readyPaymentElementOwner === paymentElementOwner
  const showPaymentFormSkeleton =
    !disabled &&
    (showStripePaymentElement
      ? !isStripePaymentElementReady
      : isBusy || !paymentSession)

  const handleStripeElementReady = useCallback(() => {
    if (currentPaymentElementOwnerRef.current !== paymentElementOwner) {
      return
    }

    setReadyPaymentElementOwner(paymentElementOwner)
    onStripeElementReady()
  }, [onStripeElementReady, paymentElementOwner])

  const handleStripeElementCompleteChange = useCallback(
    (complete: boolean) => {
      if (currentPaymentElementOwnerRef.current !== paymentElementOwner) {
        return
      }

      onStripeElementCompleteChange(complete)
    },
    [onStripeElementCompleteChange, paymentElementOwner],
  )

  const handleStripeReady = useCallback(
    (handle: StripePaymentElementHandle) => {
      if (currentPaymentElementOwnerRef.current !== paymentElementOwner) {
        return
      }

      onStripeReady(handle)
    },
    [onStripeReady, paymentElementOwner],
  )

  return {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    hasSelectedSavedPaymentCard,
    isStripePaymentElementReady,
    showPaymentFormSkeleton,
    showStripePaymentElement,
  }
}
