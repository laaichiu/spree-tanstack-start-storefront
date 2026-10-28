import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'
import { isStripeConfigured } from '../../stripe/client'
import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'
import { getCheckoutPaymentSessionInitializationDecision } from '../utils/payment/payment-session-initialization-decision'
import { initializeCheckoutPaymentSession } from '../utils/payment/payment-session-initialization'
import type { CreateCheckoutPaymentSessionAsync } from '../utils/payment/payment-session-initialization'

export function useCheckoutPaymentSessionInitialization({
  cartId,
  createPaymentSessionAsync,
  lastPaymentSessionKeyRef,
  market,
  onResetStripeElement,
  paymentSessionGenerationRef,
  paymentSessionRetryKey,
  resetPaymentSession,
  selectedPaymentMethod,
  selectedSavedStripePaymentMethodId,
  selectedSessionKey,
  selectedShippingRate,
  setIsPaymentSessionRetryable,
  setPaymentError,
  setPaymentSession,
  t,
}: {
  cartId: string
  createPaymentSessionAsync: CreateCheckoutPaymentSessionAsync
  lastPaymentSessionKeyRef: MutableRefObject<string | null>
  market: MarketSelectionInput
  onResetStripeElement: () => void
  paymentSessionGenerationRef: MutableRefObject<number>
  paymentSessionRetryKey: number
  resetPaymentSession: (error?: string | null) => void
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedStripePaymentMethodId: string | null
  selectedSessionKey: string
  selectedShippingRate: CartShippingRate | null
  setIsPaymentSessionRetryable: (retryable: boolean) => void
  setPaymentError: (error: string | null) => void
  setPaymentSession: (session: CheckoutPaymentSession | null) => void
  t: (key: MessageKey) => string
}) {
  const translateRef = useRef(t)
  const lastResetContextRef = useRef<string | null>(null)
  const selectedPaymentMethodId = selectedPaymentMethod?.id ?? ''
  const selectedPaymentMethodGatewayId = selectedPaymentMethod?.gatewayId ?? ''
  const selectedPaymentMethodSessionRequired =
    selectedPaymentMethod?.sessionRequired ?? false

  useEffect(() => {
    translateRef.current = t
  }, [t])

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const decision = getCheckoutPaymentSessionInitializationDecision({
      gatewayId: selectedPaymentMethodGatewayId,
      lastPaymentSessionKey: lastPaymentSessionKeyRef.current,
      selectedSessionKey,
      sessionRequired: selectedPaymentMethodSessionRequired,
      stripeConfigured: isStripeConfigured,
    })

    if (decision.type === 'skip') {
      return
    }

    if (decision.type === 'reset') {
      // Reset advances the session generation and changes its callbacks. It
      // must settle once per context, rather than retriggering itself.
      const resetContext = JSON.stringify([
        cartId,
        market.country,
        market.locale,
        selectedSessionKey,
        selectedPaymentMethodId,
        selectedPaymentMethodGatewayId,
        decision.reason,
        paymentSessionRetryKey,
      ])
      if (lastResetContextRef.current === resetContext) {
        return
      }
      lastResetContextRef.current = resetContext
      const error =
        decision.reason === 'unsupported_gateway'
          ? translateRef.current('checkout.unsupportedSessionPayment')
          : decision.reason === 'stripe_not_configured'
            ? translateRef.current('checkout.stripeKeyMissing')
            : undefined

      resetPaymentSession(error)
      return
    }

    lastResetContextRef.current = null
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

      const result = await initializeCheckoutPaymentSession({
        createPaymentSessionAsync,
        selectedPaymentMethodId,
        selectedSavedStripePaymentMethodId,
        selectedShippingRate,
        t: translateRef.current,
      })

      if (
        !isMountedRef.current ||
        paymentSessionGenerationRef.current !== paymentSessionGeneration ||
        lastPaymentSessionKeyRef.current !== paymentSessionKey
      ) {
        return
      }

      if (result.type === 'error' || result.type === 'missing_client_secret') {
        setPaymentError(result.message)
        setIsPaymentSessionRetryable(true)
        return
      }

      setPaymentSession(result.session)
      setIsPaymentSessionRetryable(false)
    }

    void initializePaymentSession()
  }, [
    cartId,
    createPaymentSessionAsync,
    lastPaymentSessionKeyRef,
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
