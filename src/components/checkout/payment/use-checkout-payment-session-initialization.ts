import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import {
  getCheckoutPaymentSessionExternalData,
  readStripeClientSecret,
} from '@/lib/checkout/utils/payment/payment-session'
import { isStripeConfigured } from '@/lib/stripe/client'

import type { useCreateCheckoutPaymentSession } from './use-checkout-payment'

type CreatePaymentSessionAsync = ReturnType<
  typeof useCreateCheckoutPaymentSession
>['mutateAsync']

function getMutationErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export function useCheckoutPaymentSessionInitialization({
  cartId,
  createPaymentSessionAsync,
  paymentSessionGenerationRef,
  lastPaymentSessionKeyRef,
  onResetStripeElement,
  selectedPaymentMethod,
  selectedSavedStripePaymentMethodId,
  selectedSessionKey,
  selectedShippingRate,
  paymentSessionRetryKey,
  resetPaymentSession,
  setIsPaymentSessionRetryable,
  setPaymentError,
  setPaymentSession,
}: {
  cartId: string
  createPaymentSessionAsync: CreatePaymentSessionAsync
  paymentSessionGenerationRef: MutableRefObject<number>
  lastPaymentSessionKeyRef: MutableRefObject<string | null>
  onResetStripeElement: () => void
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedStripePaymentMethodId: string | null
  selectedSessionKey: string
  selectedShippingRate: CartShippingRate | null
  paymentSessionRetryKey: number
  resetPaymentSession: (error?: string | null) => void
  setIsPaymentSessionRetryable: (retryable: boolean) => void
  setPaymentError: (error: string | null) => void
  setPaymentSession: (session: CheckoutPaymentSession | null) => void
}) {
  const { market, t } = useMarket()
  const translateRef = useRef(t)
  const selectedPaymentMethodId = selectedPaymentMethod?.id ?? ''
  const selectedPaymentMethodGatewayId = selectedPaymentMethod?.gatewayId ?? ''
  const selectedPaymentMethodSessionRequired =
    selectedPaymentMethod?.sessionRequired ?? false

  useEffect(() => {
    translateRef.current = t
  }, [t])

  useEffect(() => {
    if (!selectedPaymentMethodSessionRequired) {
      resetPaymentSession()
      return
    }

    if (selectedPaymentMethodGatewayId !== 'stripe') {
      resetPaymentSession(
        translateRef.current('checkout.unsupportedSessionPayment'),
      )
      return
    }

    if (!isStripeConfigured) {
      resetPaymentSession(translateRef.current('checkout.stripeKeyMissing'))
      return
    }

    if (lastPaymentSessionKeyRef.current === selectedSessionKey) {
      return
    }

    let cancelled = false
    const paymentSessionKey = selectedSessionKey
    const paymentSessionGeneration = paymentSessionGenerationRef.current
    lastPaymentSessionKeyRef.current = selectedSessionKey
    onResetStripeElement()
    setPaymentSession(null)
    setPaymentError(null)
    setIsPaymentSessionRetryable(false)

    async function initializePaymentSession() {
      if (!selectedPaymentMethodId) {
        return
      }

      try {
        const session = await createPaymentSessionAsync({
          externalData: getCheckoutPaymentSessionExternalData({
            savedStripePaymentMethodId: selectedSavedStripePaymentMethodId,
          }),
          paymentMethodId: selectedPaymentMethodId,
          selectedShippingRate,
        })

        if (
          cancelled ||
          paymentSessionGenerationRef.current !== paymentSessionGeneration
        ) {
          return
        }

        if (!readStripeClientSecret(session.externalData)) {
          setPaymentError(
            translateRef.current('checkout.stripeClientSecretMissing'),
          )
          setIsPaymentSessionRetryable(true)
          return
        }

        setPaymentSession(session)
        setIsPaymentSessionRetryable(false)
      } catch (error) {
        if (
          cancelled ||
          paymentSessionGenerationRef.current !== paymentSessionGeneration
        ) {
          return
        }

        setPaymentError(
          getMutationErrorMessage(
            error,
            translateRef.current('checkout.paymentSessionCreateFailed'),
          ),
        )
        setIsPaymentSessionRetryable(true)
      }
    }

    void initializePaymentSession()

    return () => {
      cancelled = true
      if (lastPaymentSessionKeyRef.current === paymentSessionKey) {
        lastPaymentSessionKeyRef.current = null
      }
    }
  }, [
    cartId,
    createPaymentSessionAsync,
    market.country,
    market.locale,
    onResetStripeElement,
    paymentSessionGenerationRef,
    paymentSessionRetryKey,
    resetPaymentSession,
    selectedPaymentMethodGatewayId,
    selectedPaymentMethodId,
    selectedPaymentMethodSessionRequired,
    selectedSavedStripePaymentMethodId,
    selectedSessionKey,
    selectedShippingRate,
    setIsPaymentSessionRetryable,
    setPaymentError,
    setPaymentSession,
  ])
}
