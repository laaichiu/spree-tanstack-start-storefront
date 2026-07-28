import { useCallback, useMemo, useRef, useState } from 'react'

import type { CheckoutPaymentSession } from '@/lib/checkout/model/checkout'
import { readStripeClientSecret } from '@/lib/checkout/utils/payment/payment-session'

export function useCheckoutPaymentSessionState({
  onResetStripeElement,
}: {
  onResetStripeElement: () => void
}) {
  const [paymentSession, setPaymentSession] =
    useState<CheckoutPaymentSession | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isPaymentSessionRetryable, setIsPaymentSessionRetryable] =
    useState(false)
  const [paymentSessionRetryKey, setPaymentSessionRetryKey] = useState(0)
  const paymentSessionGenerationRef = useRef(0)
  const lastPaymentSessionKeyRef = useRef<string | null>(null)
  const clientSecret = useMemo(
    () =>
      paymentSession
        ? readStripeClientSecret(paymentSession.externalData)
        : undefined,
    [paymentSession],
  )

  const resetPaymentSession = useCallback(
    (error: string | null = null) => {
      onResetStripeElement()
      setPaymentSession(null)
      setPaymentError(error)
      setIsPaymentSessionRetryable(false)
      paymentSessionGenerationRef.current += 1
      lastPaymentSessionKeyRef.current = null
    },
    [onResetStripeElement],
  )

  const retryPaymentSession = useCallback(() => {
    onResetStripeElement()
    setPaymentSession(null)
    setPaymentError(null)
    setIsPaymentSessionRetryable(false)
    paymentSessionGenerationRef.current += 1
    lastPaymentSessionKeyRef.current = null
    setPaymentSessionRetryKey((currentKey) => currentKey + 1)
  }, [onResetStripeElement])

  return {
    clientSecret,
    isPaymentSessionRetryable,
    paymentSessionGenerationRef,
    lastPaymentSessionKeyRef,
    paymentError,
    paymentSession,
    paymentSessionRetryKey,
    resetPaymentSession,
    retryPaymentSession,
    setIsPaymentSessionRetryable,
    setPaymentError,
    setPaymentSession,
  }
}
