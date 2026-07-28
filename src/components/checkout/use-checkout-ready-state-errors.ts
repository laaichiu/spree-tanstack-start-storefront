import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutCompletionErrorCode } from '@/lib/checkout/model/checkout'
import { getCheckoutPaymentErrorNotice } from '@/lib/checkout/utils/completion/checkout-completion-error'
import { getCheckoutRouteNavigation } from '@/lib/checkout/utils/checkout-navigation'

import {
  getCheckoutSectionElementId,
  getFirstCheckoutSectionWithErrors,
  getSingleCheckoutSectionErrors,
  removeCheckoutSectionError,
} from './checkout-requirements'
import type {
  CheckoutSectionErrorKey,
  CheckoutSectionErrors,
} from './checkout-requirements'

export function useCheckoutReadyStateErrors({
  cartId,
  initialPaymentError,
  initialPaymentErrorCode,
}: {
  cartId: string
  initialPaymentError?: string | null
  initialPaymentErrorCode?: CheckoutCompletionErrorCode | null
}) {
  const { market, t } = useMarket()
  const navigate = useNavigate()
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
  const marketRouteParams = useMemo(
    () => ({
      country: market.country,
      locale: market.locale,
    }),
    [market.country, market.locale],
  )

  function scrollToCheckoutSection(section: CheckoutSectionErrorKey) {
    window.requestAnimationFrame(() => {
      document
        .getElementById(getCheckoutSectionElementId(section))
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    })
  }

  function clearCheckoutSectionError(section: CheckoutSectionErrorKey) {
    setSectionErrors((currentErrors) =>
      removeCheckoutSectionError(currentErrors, section),
    )
  }

  function setCheckoutSectionErrorsAndScroll(
    nextSectionErrors: CheckoutSectionErrors,
  ) {
    setSectionErrors(nextSectionErrors)

    const firstSection = getFirstCheckoutSectionWithErrors(nextSectionErrors)

    if (firstSection) {
      scrollToCheckoutSection(firstSection)
    }
  }

  function setSingleCheckoutSectionError(
    section: CheckoutSectionErrorKey,
    message: string,
  ) {
    setCheckoutSectionErrorsAndScroll(
      getSingleCheckoutSectionErrors(section, message),
    )
  }

  useEffect(() => {
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

    void navigate(
      getCheckoutRouteNavigation({
        cartId,
        ...marketRouteParams,
      }),
    )
  }, [
    cartId,
    initialPaymentError,
    initialPaymentErrorCode,
    marketRouteParams,
    navigate,
    t,
  ])

  return {
    checkoutError,
    clearCheckoutSectionError,
    marketRouteParams,
    scrollToCheckoutSection,
    sectionErrors,
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
  }
}
