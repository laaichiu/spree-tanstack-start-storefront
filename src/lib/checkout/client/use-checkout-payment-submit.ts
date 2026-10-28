import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { RefObject } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { getCheckoutPaymentStateKey } from '@/lib/checkout/contracts'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'
import {
  useCompleteCheckoutOrder,
  useCompleteCheckoutPaymentSession,
  useCreateDirectCheckoutPayment,
} from './use-checkout-payment'
import type { CheckoutPaymentSession } from '../utils/payment/payment-session-contract'
import { submitCheckoutPayment } from '../utils/payment/payment-submit'
import type { CheckoutPaymentSubmitResult } from '../utils/payment/payment-submit-result'
import type { CheckoutPaymentElementHandle } from '../utils/payment/payment-provider-confirmation'
import {
  getCheckoutPaymentSubmissionMutationKey,
  getCheckoutPaymentSubmissionMutationScopeId,
} from './checkout-payment-submission'

export type { CheckoutPaymentSubmitResult }

export function useCheckoutPaymentSubmit({
  cart,
  clientSecret,
  isStripeElementReady,
  market,
  paymentSession,
  selectedPaymentMethod,
  selectedSavedPaymentProfileIdForSession,
  selectedShippingRate,
  setPaymentError,
  shippingReady,
  stripePaymentHandleRef,
  t,
}: {
  cart: CheckoutOrder
  clientSecret?: string
  isStripeElementReady: boolean
  market: MarketSelectionInput
  paymentSession: CheckoutPaymentSession | null
  selectedPaymentMethod: CheckoutPaymentMethod | null
  selectedSavedPaymentProfileIdForSession: string | null
  selectedShippingRate: CartShippingRate | null
  setPaymentError: (error: string | null) => void
  shippingReady: boolean
  stripePaymentHandleRef: RefObject<CheckoutPaymentElementHandle | null>
  t: (key: MessageKey) => string
}) {
  const [confirmingPaymentOwner, setConfirmingPaymentOwner] = useState<
    string | null
  >(null)
  const [submissionOwner, setSubmissionOwner] = useState<string | null>(null)
  const paymentSubmissionContextKey = JSON.stringify([
    getCheckoutPaymentStateKey(cart),
    market.country,
    market.locale,
    selectedPaymentMethod?.gatewayId ?? null,
    selectedPaymentMethod?.id ?? null,
    selectedPaymentMethod?.sessionRequired ?? null,
    selectedSavedPaymentProfileIdForSession,
    paymentSession?.id ?? null,
    clientSecret ?? null,
    shippingReady,
    isStripeElementReady,
  ])
  const currentPaymentSubmissionContextKeyRef = useRef(
    paymentSubmissionContextKey,
  )
  currentPaymentSubmissionContextKeyRef.current = paymentSubmissionContextKey
  const paymentSubmissionGenerationRef = useRef(0)
  useEffect(() => {
    paymentSubmissionGenerationRef.current += 1
    setConfirmingPaymentOwner(null)
    setSubmissionOwner(null)

    return () => {
      paymentSubmissionGenerationRef.current += 1
    }
  }, [paymentSubmissionContextKey])
  const completePaymentSession = useCompleteCheckoutPaymentSession({
    cartId: cart.id,
    market,
  })
  const createDirectPayment = useCreateDirectCheckoutPayment({
    cartId: cart.id,
    market,
  })
  const completeOrder = useCompleteCheckoutOrder({
    cartId: cart.id,
    market,
  })
  const completePaymentSessionAsync = completePaymentSession.mutateAsync
  const createDirectPaymentAsync = createDirectPayment.mutateAsync
  const completeOrderAsync = completeOrder.mutateAsync
  const submissionMutationKey = getCheckoutPaymentSubmissionMutationKey({
    cartId: cart.id,
    market,
  })
  const paymentSubmission = useMutation({
    mutationKey: submissionMutationKey,
    scope: {
      id: getCheckoutPaymentSubmissionMutationScopeId({
        cartId: cart.id,
        market,
      }),
    },
    mutationFn: ({ generation }: { generation: number }) => {
      const isCurrent = () =>
        currentPaymentSubmissionContextKeyRef.current ===
          paymentSubmissionContextKey &&
        paymentSubmissionGenerationRef.current === generation

      return submitCheckoutPayment({
        amountDue: cart.amountDue?.amount ?? null,
        cartId: cart.id,
        clientSecret,
        completeOrder: completeOrderAsync,
        completePaymentSession: completePaymentSessionAsync,
        createDirectPayment: createDirectPaymentAsync,
        isStripeElementReady,
        market: {
          country: market.country,
          locale: market.locale,
        },
        onPaymentSubmitEnd: () => {
          if (isCurrent()) {
            setConfirmingPaymentOwner(null)
          }
        },
        onPaymentSubmitStart: () => {
          if (isCurrent()) {
            setConfirmingPaymentOwner(paymentSubmissionContextKey)
          }
        },
        paymentSession,
        selectedPaymentMethod,
        selectedSavedPaymentProfileIdForSession,
        selectedShippingRate,
        setPaymentError: (error) => {
          if (isCurrent()) {
            setPaymentError(error)
          }
        },
        shippingReady,
        stripePaymentHandle: stripePaymentHandleRef.current,
        t,
      })
    },
  })
  const isSubmittingPayment =
    submissionOwner === paymentSubmissionContextKey ||
    confirmingPaymentOwner === paymentSubmissionContextKey
  const submitPaymentAsync = paymentSubmission.mutateAsync

  const submitPayment = useCallback(() => {
    const generation = paymentSubmissionGenerationRef.current
    const requestOwner = paymentSubmissionContextKey

    setSubmissionOwner(requestOwner)

    return submitPaymentAsync({ generation }).finally(() => {
      if (
        currentPaymentSubmissionContextKeyRef.current === requestOwner &&
        paymentSubmissionGenerationRef.current === generation
      ) {
        setSubmissionOwner(null)
      }
    })
  }, [paymentSubmissionContextKey, submitPaymentAsync])

  return {
    isSubmittingPayment,
    paymentSubmissionContextKey,
    submitPayment,
  }
}
