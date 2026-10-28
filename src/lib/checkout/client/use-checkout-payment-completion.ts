import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import type { CheckoutRequirementSection } from '@/lib/checkout/contracts'
import type { MessageKey } from '../../i18n/messages'
import { getCheckoutCompletionErrorMessage } from '../utils/completion/checkout-completion-error'
import { getCheckoutRenderedPaymentSubmitAction } from '../utils/payment/payment-submit-result'
import type { CheckoutPaymentSubmitResult } from '../utils/payment/payment-submit-result'

const PAYMENT_SECTION_NOT_READY_OWNER = Symbol('payment-section-not-ready')

export type CheckoutPaymentSubmitter = {
  ownerKey: string
  submit: () => Promise<CheckoutPaymentSubmitResult | undefined>
}

export function useCheckoutPaymentCompletion({
  cartId,
  navigateToConfirmPayment,
  navigateToOrderPlaced,
  paymentSectionRef,
  setCheckoutError,
  setSingleCheckoutSectionError,
  t,
}: {
  cartId: string
  navigateToConfirmPayment: (
    cartId: string,
    sessionId?: string,
  ) => Promise<void>
  navigateToOrderPlaced: (orderId: string) => Promise<void>
  paymentSectionRef: RefObject<CheckoutPaymentSubmitter | null>
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
}) {
  const paymentCompletionInFlightOwnerRef = useRef<
    CheckoutPaymentSubmitter | typeof PAYMENT_SECTION_NOT_READY_OWNER | null
  >(null)
  const paymentCompletionGenerationRef = useRef(0)

  useEffect(() => {
    paymentCompletionGenerationRef.current += 1

    return () => {
      paymentCompletionGenerationRef.current += 1
    }
  }, [cartId, navigateToConfirmPayment, navigateToOrderPlaced])

  return useCallback(async () => {
    const paymentCompletionGeneration = paymentCompletionGenerationRef.current
    const paymentSubmitter = paymentSectionRef.current
    const paymentCompletionOwnerKey =
      paymentSubmitter ?? PAYMENT_SECTION_NOT_READY_OWNER
    const isCurrentPaymentCompletion = () =>
      paymentCompletionGenerationRef.current === paymentCompletionGeneration &&
      paymentSectionRef.current === paymentSubmitter

    if (
      paymentCompletionInFlightOwnerRef.current === paymentCompletionOwnerKey
    ) {
      return
    }

    paymentCompletionInFlightOwnerRef.current = paymentCompletionOwnerKey

    try {
      if (!isCurrentPaymentCompletion()) {
        return
      }

      const result = await paymentSubmitter?.submit()
      if (!isCurrentPaymentCompletion()) {
        return
      }

      const action = getCheckoutRenderedPaymentSubmitAction({
        cartId,
        paymentFormNotReadyMessage: t('checkout.paymentFormNotReady'),
        result,
      })

      if (action.type === 'show_payment_error') {
        setCheckoutError(action.message)
        setSingleCheckoutSectionError('payment', action.message)
        return
      }

      if (action.type === 'ignore_error') {
        return
      }

      if (action.type === 'confirm_payment') {
        if (!isCurrentPaymentCompletion()) {
          return
        }

        try {
          await navigateToConfirmPayment(cartId, action.sessionId)
        } catch {
          if (!isCurrentPaymentCompletion()) {
            return
          }

          const message = getCheckoutCompletionErrorMessage({
            errorCode: 'payment_confirmation_failed',
            t,
          })
          setCheckoutError(message)
          setSingleCheckoutSectionError('payment', message)
        }

        return
      }

      if (!isCurrentPaymentCompletion()) {
        return
      }

      try {
        await navigateToOrderPlaced(action.orderId)
      } catch {
        if (!isCurrentPaymentCompletion()) {
          return
        }

        const message = getCheckoutCompletionErrorMessage({
          errorCode: 'order_complete_failed',
          t,
        })
        setCheckoutError(message)
        setSingleCheckoutSectionError('payment', message)
      }
    } finally {
      if (isCurrentPaymentCompletion()) {
        paymentCompletionInFlightOwnerRef.current = null
      }
    }
  }, [
    cartId,
    navigateToConfirmPayment,
    navigateToOrderPlaced,
    paymentSectionRef,
    paymentCompletionGenerationRef,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  ])
}
