import { useCallback, useMemo, useRef, useState } from 'react'

import { readStripeClientSecret } from '../utils/payment/payment-session'
import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'

type OwnedPaymentSessionState<T> = {
  generation: number
  ownerKey: string
  value: T
}

export function useCheckoutPaymentSessionState({
  onResetStripeElement,
  ownerKey,
}: {
  onResetStripeElement: () => void
  ownerKey: string
}) {
  const [paymentSessionState, setPaymentSessionState] = useState<
    OwnedPaymentSessionState<CheckoutPaymentSession | null>
  >({
    generation: 0,
    ownerKey,
    value: null,
  })
  const [paymentErrorState, setPaymentErrorState] = useState<
    OwnedPaymentSessionState<string | null>
  >({
    generation: 0,
    ownerKey,
    value: null,
  })
  const [paymentSessionRetryableState, setPaymentSessionRetryableState] =
    useState<OwnedPaymentSessionState<boolean>>({
      generation: 0,
      ownerKey,
      value: false,
    })
  const [paymentSessionRetryKey, setPaymentSessionRetryKey] = useState(0)
  const paymentSessionGenerationRef = useRef(0)
  const lastPaymentSessionKeyRef = useRef<string | null>(null)
  const currentOwnerRef = useRef(ownerKey)

  if (currentOwnerRef.current !== ownerKey) {
    currentOwnerRef.current = ownerKey
    paymentSessionGenerationRef.current += 1
    lastPaymentSessionKeyRef.current = null
  }
  const ownerGeneration = paymentSessionGenerationRef.current
  const isCurrentOwner = useCallback(
    () =>
      currentOwnerRef.current === ownerKey &&
      paymentSessionGenerationRef.current === ownerGeneration,
    [ownerGeneration, ownerKey],
  )

  const setPaymentSession = useCallback(
    (session: CheckoutPaymentSession | null) => {
      if (!isCurrentOwner()) {
        return
      }

      setPaymentSessionState({
        generation: ownerGeneration,
        ownerKey,
        value: session,
      })
    },
    [isCurrentOwner, ownerGeneration, ownerKey],
  )
  const setPaymentError = useCallback(
    (error: string | null) => {
      if (!isCurrentOwner()) {
        return
      }

      setPaymentErrorState({
        generation: ownerGeneration,
        ownerKey,
        value: error,
      })
    },
    [isCurrentOwner, ownerGeneration, ownerKey],
  )
  const setIsPaymentSessionRetryable = useCallback(
    (retryable: boolean) => {
      if (!isCurrentOwner()) {
        return
      }

      setPaymentSessionRetryableState({
        generation: ownerGeneration,
        ownerKey,
        value: retryable,
      })
    },
    [isCurrentOwner, ownerGeneration, ownerKey],
  )
  const clientSecret = useMemo(
    () =>
      paymentSessionState.ownerKey === ownerKey &&
      paymentSessionState.generation === ownerGeneration &&
      paymentSessionState.value
        ? readStripeClientSecret(paymentSessionState.value.providerData)
        : undefined,
    [ownerGeneration, ownerKey, paymentSessionState],
  )

  const resetPaymentSession = useCallback(
    (error: string | null = null) => {
      if (!isCurrentOwner()) {
        return
      }

      onResetStripeElement()
      paymentSessionGenerationRef.current += 1
      const nextGeneration = paymentSessionGenerationRef.current
      setPaymentSessionState({
        generation: nextGeneration,
        ownerKey,
        value: null,
      })
      setPaymentErrorState({
        generation: nextGeneration,
        ownerKey,
        value: error,
      })
      setPaymentSessionRetryableState({
        generation: nextGeneration,
        ownerKey,
        value: false,
      })
      lastPaymentSessionKeyRef.current = null
    },
    [isCurrentOwner, onResetStripeElement, ownerKey],
  )

  const retryPaymentSession = useCallback(() => {
    if (!isCurrentOwner()) {
      return
    }

    onResetStripeElement()
    paymentSessionGenerationRef.current += 1
    const nextGeneration = paymentSessionGenerationRef.current
    setPaymentSessionState({
      generation: nextGeneration,
      ownerKey,
      value: null,
    })
    setPaymentErrorState({ generation: nextGeneration, ownerKey, value: null })
    setPaymentSessionRetryableState({
      generation: nextGeneration,
      ownerKey,
      value: false,
    })
    lastPaymentSessionKeyRef.current = null
    setPaymentSessionRetryKey((currentKey) => currentKey + 1)
  }, [isCurrentOwner, onResetStripeElement, ownerKey])

  return {
    clientSecret:
      paymentSessionState.ownerKey === ownerKey &&
      paymentSessionState.generation === ownerGeneration
        ? clientSecret
        : undefined,
    isPaymentSessionRetryable:
      paymentSessionRetryableState.ownerKey === ownerKey &&
      paymentSessionRetryableState.generation === ownerGeneration
        ? paymentSessionRetryableState.value
        : false,
    paymentSessionGenerationRef,
    lastPaymentSessionKeyRef,
    paymentError:
      paymentErrorState.ownerKey === ownerKey &&
      paymentErrorState.generation === ownerGeneration
        ? paymentErrorState.value
        : null,
    paymentSession:
      paymentSessionState.ownerKey === ownerKey &&
      paymentSessionState.generation === ownerGeneration
        ? paymentSessionState.value
        : null,
    paymentSessionRetryKey,
    resetPaymentSession,
    retryPaymentSession,
    setIsPaymentSessionRetryable,
    setPaymentError,
    setPaymentSession,
  }
}
