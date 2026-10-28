import { useElements, useStripe } from '@stripe/react-stripe-js'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'
import { useCallback, useEffect, useRef } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/contracts'
import { getCheckoutPaymentStateKey } from '@/lib/checkout/contracts'

import type { ExpressCheckoutPaymentActions } from '@/lib/checkout/utils/express/express-checkout-actions'
import { runExpressCheckoutPayment } from '@/lib/checkout/utils/express/express-checkout-payment-flow'
import { readCheckoutMutationErrorMessage } from '@/lib/checkout/utils/checkout-error'
import {
  getCheckoutPaymentSubmissionMutationKey,
  getCheckoutPaymentSubmissionMutationScopeId,
} from '@/lib/checkout/client/checkout-payment-submission'

type ExpressCheckoutPaymentOptions = {
  actions: ExpressCheckoutPaymentActions
  cart: CheckoutOrder
  setError: (error: string | null) => void
  setProcessing: (processing: boolean) => void
  stripeMethod: CheckoutPaymentMethod | null
}

type ExpressCheckoutPaymentSubmissionInput = {
  event: StripeExpressCheckoutElementConfirmEvent
  generation: number
}

export function useExpressCheckoutPayment({
  actions,
  cart,
  setError,
  setProcessing,
  stripeMethod,
}: ExpressCheckoutPaymentOptions) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { market, t } = useMarket()
  const isConfirmingRef = useRef(false)
  const paymentSubmissionOwnerKey = JSON.stringify([
    getCheckoutPaymentStateKey(cart),
    market.country,
    market.locale,
  ])
  const paymentSubmissionOwnerGenerationRef = useRef(0)
  const previousPaymentSubmissionOwnerKeyRef = useRef(paymentSubmissionOwnerKey)

  if (
    previousPaymentSubmissionOwnerKeyRef.current !== paymentSubmissionOwnerKey
  ) {
    previousPaymentSubmissionOwnerKeyRef.current = paymentSubmissionOwnerKey
    paymentSubmissionOwnerGenerationRef.current += 1
  }

  const paymentSubmissionOwnerGeneration =
    paymentSubmissionOwnerGenerationRef.current
  const currentPaymentSubmissionOwnerRef = useRef(paymentSubmissionOwnerKey)
  currentPaymentSubmissionOwnerRef.current = paymentSubmissionOwnerKey
  const isMountedRef = useRef(true)
  const paymentSubmissionInFlightOwnerRef = useRef<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    isConfirmingRef.current = false
    setProcessing(false)

    return () => {
      isMountedRef.current = false
      isConfirmingRef.current = false
    }
  }, [paymentSubmissionOwnerKey, setProcessing])

  const redirectToConfirmation = useCallback(
    async (sessionId?: string) => {
      await navigate({
        params: {
          country: market.country,
          id: cart.id,
          locale: market.locale,
        },
        search: {
          session: sessionId,
        },
        to: '/$country/$locale/confirm-payment/$id',
      })
    },
    [cart.id, market.country, market.locale, navigate],
  )

  const redirectToOrderPlaced = useCallback(
    async (orderId: string) => {
      await navigate({
        params: {
          country: market.country,
          id: orderId,
          locale: market.locale,
        },
        to: '/$country/$locale/order-placed/$id',
      })
    },
    [market.country, market.locale, navigate],
  )
  const paymentSubmission = useMutation({
    mutationKey: getCheckoutPaymentSubmissionMutationKey({
      cartId: cart.id,
      market,
    }),
    scope: {
      id: getCheckoutPaymentSubmissionMutationScopeId({
        cartId: cart.id,
        market,
      }),
    },
    mutationFn: ({
      event,
      generation,
    }: ExpressCheckoutPaymentSubmissionInput) =>
      runExpressCheckoutPayment({
        actions,
        cartId: cart.id,
        elements,
        event,
        isConfirmingRef,
        market: {
          country: market.country,
          locale: market.locale,
        },
        redirectToConfirmation,
        redirectToOrderPlaced,
        setError,
        setProcessing,
        stripe,
        stripeMethod,
        t,
        isCurrent: () =>
          currentPaymentSubmissionOwnerRef.current ===
            paymentSubmissionOwnerKey &&
          paymentSubmissionOwnerGenerationRef.current === generation &&
          isMountedRef.current,
      }),
  })
  const submitPaymentAsync = paymentSubmission.mutateAsync

  return useCallback(
    (event: StripeExpressCheckoutElementConfirmEvent) => {
      const paymentSubmissionGeneration = paymentSubmissionOwnerGeneration
      const paymentSubmissionOwner = `${paymentSubmissionGeneration}:${paymentSubmissionOwnerKey}`

      if (
        paymentSubmissionInFlightOwnerRef.current === paymentSubmissionOwner
      ) {
        event.paymentFailed({ reason: 'fail' })
        return Promise.resolve()
      }

      paymentSubmissionInFlightOwnerRef.current = paymentSubmissionOwner

      return submitPaymentAsync({
        event,
        generation: paymentSubmissionGeneration,
      })
        .catch((error) => {
          const message = readCheckoutMutationErrorMessage(
            error,
            t('checkout.paymentSubmitFailed'),
          )

          if (
            currentPaymentSubmissionOwnerRef.current ===
              paymentSubmissionOwnerKey &&
            paymentSubmissionOwnerGenerationRef.current ===
              paymentSubmissionGeneration &&
            isMountedRef.current
          ) {
            setError(message)
          }

          event.paymentFailed({
            message,
            reason: 'fail',
          })
        })
        .finally(() => {
          if (
            currentPaymentSubmissionOwnerRef.current ===
              paymentSubmissionOwnerKey &&
            paymentSubmissionOwnerGenerationRef.current ===
              paymentSubmissionGeneration &&
            isMountedRef.current
          ) {
            paymentSubmissionInFlightOwnerRef.current = null
          }
        })
    },
    [
      paymentSubmissionOwnerGeneration,
      paymentSubmissionOwnerKey,
      setError,
      submitPaymentAsync,
      t,
    ],
  )
}
