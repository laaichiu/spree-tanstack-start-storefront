import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getFirstCheckoutSectionWithErrors,
  getSingleCheckoutSectionErrors,
  removeCheckoutSectionError,
} from '@/lib/checkout/contracts'
import type {
  CheckoutRequirementSection,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import type { MessageKey } from '../../i18n/messages'

import type { CheckoutCompletionErrorCode } from '../utils/completion/checkout-completion-contract'
import {
  getCheckoutPaymentErrorNotice,
  getCheckoutPaymentErrorSignature,
} from '../utils/completion/checkout-completion-error'

export type CheckoutReadyStateErrorRuntimeOptions = {
  checkoutContextKey: string
  initialPaymentError?: string | null
  initialPaymentErrorCode?: CheckoutCompletionErrorCode | null
  navigateToCheckout: () => Promise<void>
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
  t: (key: MessageKey) => string
}

export function useCheckoutReadyStateErrors({
  checkoutContextKey,
  initialPaymentError,
  initialPaymentErrorCode,
  navigateToCheckout,
  scrollToCheckoutSection,
  t,
}: CheckoutReadyStateErrorRuntimeOptions) {
  const [checkoutError, setCheckoutError] = useState<string | null>(
    () =>
      getCheckoutPaymentErrorNotice({
        error: initialPaymentError,
        errorCode: initialPaymentErrorCode,
        t,
      })?.message ?? null,
  )
  const [sectionErrors, setSectionErrors] = useState<CheckoutSectionErrors>({})
  const appliedPaymentErrorRef = useRef<string | null>(null)
  const lastCheckoutContextKeyRef = useRef(checkoutContextKey)

  useEffect(() => {
    if (lastCheckoutContextKeyRef.current === checkoutContextKey) {
      return
    }

    lastCheckoutContextKeyRef.current = checkoutContextKey
    setCheckoutError(null)
    setSectionErrors({})
  }, [checkoutContextKey])

  const clearCheckoutSectionError = useCallback(
    (section: CheckoutRequirementSection) => {
      setSectionErrors((currentErrors) =>
        removeCheckoutSectionError(currentErrors, section),
      )
    },
    [],
  )

  const setCheckoutSectionErrorsAndScroll = useCallback(
    (nextSectionErrors: CheckoutSectionErrors) => {
      setSectionErrors(nextSectionErrors)

      const firstSection = getFirstCheckoutSectionWithErrors(nextSectionErrors)

      if (firstSection) {
        scrollToCheckoutSection(firstSection)
      }
    },
    [scrollToCheckoutSection],
  )

  const setSingleCheckoutSectionError = useCallback(
    (section: CheckoutRequirementSection, message: string) => {
      setCheckoutSectionErrorsAndScroll(
        getSingleCheckoutSectionErrors(section, message),
      )
    },
    [setCheckoutSectionErrorsAndScroll],
  )

  useEffect(() => {
    if (
      !getCheckoutPaymentErrorSignature({
        error: initialPaymentError,
        errorCode: initialPaymentErrorCode,
      })
    ) {
      appliedPaymentErrorRef.current = null
      return
    }

    const paymentErrorNotice = getCheckoutPaymentErrorNotice({
      appliedSignature: appliedPaymentErrorRef.current,
      error: initialPaymentError,
      errorCode: initialPaymentErrorCode,
      t,
    })

    if (!paymentErrorNotice) {
      return
    }

    appliedPaymentErrorRef.current = paymentErrorNotice.signature
    setCheckoutError(paymentErrorNotice.message)

    void navigateToCheckout().catch(() => undefined)
  }, [initialPaymentError, initialPaymentErrorCode, navigateToCheckout, t])

  return {
    checkoutError,
    clearCheckoutSectionError,
    sectionErrors,
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
  }
}
