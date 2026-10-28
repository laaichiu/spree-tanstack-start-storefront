import { useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { readCheckoutMutationErrorMessage } from '../../utils/checkout-error'

import type {
  CheckoutRequirementSection,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import { runCheckoutSubmitFlow } from '../../utils/completion/checkout-submit-flow'
import type { CheckoutSubmitPreparationResult } from '../../utils/completion/checkout-submit-preparation'
import type { MessageKey } from '../../../i18n/messages'

type CheckoutSubmitActionOptions = {
  actions: {
    setCheckoutError: (error: string | null) => void
    setCheckoutSectionErrorsAndScroll: (
      nextSectionErrors: CheckoutSectionErrors,
    ) => void
    setSingleCheckoutSectionError: (
      section: CheckoutRequirementSection,
      message: string,
    ) => void
  }
  checkoutContextKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  preparePaymentSubmission: (
    isCurrent: () => boolean,
  ) => Promise<CheckoutSubmitPreparationResult>
  navigateToCheckout: (cartId: string) => Promise<void>
  t: (key: MessageKey) => string
  runtime: {
    clearAutoSaveAddressTimeout: () => void
    setIsCheckoutSubmitting: Dispatch<SetStateAction<boolean>>
    setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  }
  submitRenderedPayment: () => Promise<void>
}

export function useCheckoutSubmitAction({
  actions: {
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
  },
  checkoutContextKey,
  pendingPaymentShippingRateRef,
  preparePaymentSubmission,
  navigateToCheckout,
  t,
  runtime: {
    clearAutoSaveAddressTimeout,
    setIsCheckoutSubmitting,
    setPendingPaymentSubmitKey,
  },
  submitRenderedPayment,
}: CheckoutSubmitActionOptions) {
  const paymentSubmissionInFlightRef = useRef(false)
  const paymentSubmissionGenerationRef = useRef(0)

  useEffect(() => {
    paymentSubmissionGenerationRef.current += 1
    paymentSubmissionInFlightRef.current = false
    setIsCheckoutSubmitting(false)

    return () => {
      paymentSubmissionGenerationRef.current += 1
      paymentSubmissionInFlightRef.current = false
    }
  }, [checkoutContextKey, setIsCheckoutSubmitting])

  async function handleSubmitPayment() {
    const paymentSubmissionGeneration = paymentSubmissionGenerationRef.current

    if (paymentSubmissionInFlightRef.current) {
      return
    }

    paymentSubmissionInFlightRef.current = true
    setIsCheckoutSubmitting(true)
    clearAutoSaveAddressTimeout()
    setCheckoutError(null)
    setCheckoutSectionErrorsAndScroll({})

    try {
      await runCheckoutSubmitFlow({
        navigateToCheckout,
        pendingPaymentShippingRateRef,
        preparePaymentSubmission,
        setCheckoutError,
        setPendingPaymentSubmitKey,
        submitRenderedPayment,
        isCurrent: () =>
          paymentSubmissionGenerationRef.current ===
          paymentSubmissionGeneration,
      })
    } catch (error) {
      if (
        paymentSubmissionGenerationRef.current !== paymentSubmissionGeneration
      ) {
        return
      }

      const message = readCheckoutMutationErrorMessage(
        error,
        t('checkout.paymentSubmitFailed'),
      )

      setCheckoutError(message)
      setSingleCheckoutSectionError('payment', message)
    } finally {
      if (
        paymentSubmissionGenerationRef.current === paymentSubmissionGeneration
      ) {
        paymentSubmissionInFlightRef.current = false
        setIsCheckoutSubmitting(false)
      }
    }
  }

  return handleSubmitPayment
}
